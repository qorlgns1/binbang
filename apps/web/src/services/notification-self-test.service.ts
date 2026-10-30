import { randomUUID } from 'node:crypto';

import { Accommodation, AgodaAlertEvent, getDataSource } from '@workspace/db';

import { saveQueuedEmailNotifications } from '@/services/agoda-polling.service';

export type NotificationSelfTestResult =
  | { status: 'passed'; durationMs: number }
  | { status: 'skipped'; reason: 'no_accommodation'; durationMs: number }
  | { status: 'failed'; error: string; durationMs: number };

/**
 * 빈방 감지 → 알림 대기열 저장 경로가 현재 빌드에서 동작하는지 확인한다.
 *
 * polling과 같은 저장 코드(이벤트 save + saveQueuedEmailNotifications)를 트랜잭션 안에서
 * 실행하고 항상 롤백한다. 커밋되지 않으므로 dispatch가 이 행을 보는 일은 없다.
 * 배포 직후 호출해서, 압축된 빌드에서만 생기는 저장 오류를 바로 드러내기 위한 용도다.
 */
export async function runNotificationSelfTest(): Promise<NotificationSelfTestResult> {
  const startedAt = Date.now();
  const ds = await getDataSource();
  const queryRunner = ds.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const manager = queryRunner.manager;
    const [accommodation] = await manager.getRepository(Accommodation).find({ select: { id: true }, take: 1 });
    if (!accommodation) {
      return { status: 'skipped', reason: 'no_accommodation', durationMs: Date.now() - startedAt };
    }

    const eventRepo = manager.getRepository(AgodaAlertEvent);
    const event = eventRepo.create({
      accommodationId: accommodation.id,
      type: 'vacancy',
      eventKey: `self_test:${randomUUID()}`,
      offerKey: null,
      status: 'self_test',
      beforeHash: null,
      afterHash: null,
      meta: { selfTest: true },
    });
    await eventRepo.save(event);
    if (event.id == null) {
      throw new Error('alert event id was not returned after save');
    }

    const queued = await saveQueuedEmailNotifications(manager, {
      accommodationId: accommodation.id,
      alertEventIds: [event.id],
    });
    if (queued !== 1) {
      throw new Error(`expected 1 queued notification, got ${queued}`);
    }

    return { status: 'passed', durationMs: Date.now() - startedAt };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      durationMs: Date.now() - startedAt,
    };
  } finally {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  }
}
