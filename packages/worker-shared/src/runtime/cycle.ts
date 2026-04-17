import type { AvailabilityStatus, Platform } from '@workspace/db';
import { getDataSource, Accommodation, CheckCycle, IsNull, Not } from '@workspace/db';

import { updateHeartbeat } from './heartbeat.js';

export interface ActiveAccommodation {
  id: string;
  name: string;
  url: string;
  platform: Platform;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  lastStatus: AvailabilityStatus | null;
  user: { id: string; kakaoAccessToken: string | null };
}

export async function findActiveAccommodations(): Promise<ActiveAccommodation[]> {
  const ds = await getDataSource();
  const accommodations = await ds.getRepository(Accommodation).find({
    where: {
      isActive: true,
      checkIn: Not(IsNull()),
      url: Not(IsNull()),
    },
    select: {
      id: true,
      name: true,
      url: true,
      platform: true,
      checkIn: true,
      checkOut: true,
      adults: true,
      lastStatus: true,
    },
    relations: { user: true },
  });

  // checkIn >= now 필터 (TypeORM에서는 MoreThanOrEqual을 사용하거나 앱 레벨 필터)
  const now = new Date();
  return accommodations.flatMap((a) => {
    if (!a.url || a.checkIn < now) {
      return [];
    }

    return [
      {
        id: a.id,
        name: a.name,
        url: a.url,
        platform: a.platform,
        checkIn: a.checkIn,
        checkOut: a.checkOut,
        adults: a.adults,
        lastStatus: a.lastStatus,
        user: { id: a.user.id, kakaoAccessToken: a.user.kakaoAccessToken },
      },
    ];
  });
}

export interface CreateCheckCycleInput {
  startedAt: Date;
  totalCount: number;
  concurrency: number;
  browserPoolSize: number;
  navigationTimeoutMs: number;
  contentWaitMs: number;
  maxRetries: number;
}

export async function createCheckCycle(input: CreateCheckCycleInput): Promise<string> {
  const ds = await getDataSource();
  const repo = ds.getRepository(CheckCycle);
  const cycle = repo.create(input);
  await repo.save(cycle);
  return cycle.id;
}

export async function finalizeCycleCounter(cycleId: string, success: boolean): Promise<void> {
  const ds = await getDataSource();

  const cycleDurationMs = await ds.transaction(async (manager): Promise<number | null> => {
    const cycleRepo = manager.getRepository(CheckCycle);

    // 카운터 원자적 증가
    await manager
      .createQueryBuilder()
      .update(CheckCycle)
      .set(success ? { successCount: () => '"successCount" + 1' } : { errorCount: () => '"errorCount" + 1' })
      .where('id = :id', { id: cycleId })
      .execute();

    // 완료 여부 확인을 위해 갱신된 값 조회
    const updatedCycle = await cycleRepo.findOne({
      where: { id: cycleId },
      select: { successCount: true, errorCount: true, totalCount: true, completedAt: true, startedAt: true },
    });

    if (!updatedCycle) return null;

    const completedCount = (updatedCycle.successCount ?? 0) + (updatedCycle.errorCount ?? 0);
    if (updatedCycle.totalCount && completedCount >= updatedCycle.totalCount && !updatedCycle.completedAt) {
      const durationMs = Date.now() - new Date(updatedCycle.startedAt).getTime();
      await cycleRepo.update({ id: cycleId }, { completedAt: new Date(), durationMs });
      return durationMs;
    }

    return null;
  });

  if (cycleDurationMs != null) {
    await updateHeartbeat(false);
    console.log(`\nMonitoring completed (${Math.round(cycleDurationMs / 1000)}s)\n`);
  }
}
