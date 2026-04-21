import { getDataSource, WorkerHeartbeat, HeartbeatHistory, User, LessThan, Not } from '@workspace/db';

import { sendAlertNotification } from './notifications';
import { getSettings } from './settings/index';
import { getEnv } from './settings/env';

// ── Types ──

export interface HeartbeatHistoryItem {
  id: number;
  timestamp: Date;
  status: 'healthy' | 'unhealthy' | 'processing';
  isProcessing: boolean;
  uptime?: number | null;
  workerId: string;
}

// ── Heartbeat Update ──

let monitoringInterval: NodeJS.Timeout | null = null;
const lastAlertTime = new Map<string, number>();

/**
 * 하트비트 업데이트
 */
export async function updateHeartbeat(isProcessing = false): Promise<void> {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(WorkerHeartbeat);

    const existing = await repo.findOne({ where: { id: 'singleton' } });
    if (existing) {
      await repo.update({ id: 'singleton' }, { lastHeartbeatAt: new Date(), isProcessing });
    } else {
      const entity = repo.create({
        id: 'singleton',
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
        isProcessing,
      });
      await repo.save(entity);
    }
  } catch (error) {
    console.error('Heartbeat update failed:', error);
  }
}

// ── Heartbeat History ──

let lastHeartbeatCleanupAt = 0;
const HEARTBEAT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1시간

export async function recordHeartbeatHistory(
  status: 'healthy' | 'unhealthy' | 'processing',
  isProcessing: boolean,
  uptime?: number,
): Promise<void> {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(HeartbeatHistory);

    const entity = repo.create({
      status,
      isProcessing,
      uptime,
      workerId: 'singleton',
    });
    await repo.save(entity);

    // 24시간 이전 데이터 정리 (1시간에 한 번만 실행)
    if (Date.now() - lastHeartbeatCleanupAt > HEARTBEAT_CLEANUP_INTERVAL_MS) {
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);
      await repo.delete({ timestamp: LessThan(oneDayAgo) });
      lastHeartbeatCleanupAt = Date.now();
    }
  } catch (error) {
    console.error('Heartbeat history record failed:', error);
  }
}

export async function getHeartbeatHistory(hours: number = 24): Promise<HeartbeatHistoryItem[]> {
  try {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    const ds = await getDataSource();

    return (await ds.getRepository(HeartbeatHistory).find({
      where: { timestamp: Not(LessThan(since)) },
      order: { timestamp: 'ASC' },
    })) as HeartbeatHistoryItem[];
  } catch (error) {
    console.error('Heartbeat history fetch failed:', error);
    return [];
  }
}

// ── Monitoring ──

/**
 * 워커 상태 체크 및 알림
 */
async function checkWorker(): Promise<void> {
  try {
    const ds = await getDataSource();
    const heartbeat = await ds.getRepository(WorkerHeartbeat).findOne({ where: { id: 'singleton' } });

    if (!heartbeat) {
      await sendAlert('Worker heartbeat not found', 'Worker has not started or DB connection issue.');
      return;
    }

    const config = getSettings().heartbeat;
    const now = Date.now();
    const timeSinceLastHeartbeat = now - new Date(heartbeat.lastHeartbeatAt).getTime();
    const missedBeats = Math.floor(timeSinceLastHeartbeat / config.intervalMs);

    // 워커 다운 감지
    if (missedBeats >= config.missedThreshold) {
      const alertKey = 'worker_down';

      if (shouldSendAlert(alertKey, config.workerDownCooldownMs)) {
        await sendAlert(
          `Worker not responding (${missedBeats} missed)`,
          `Last heartbeat: ${heartbeat.lastHeartbeatAt.toISOString()}\nExpected interval: ${config.intervalMs / 1000}s`,
        );
      }
    }

    // 처리 시간 초과 감지
    if (heartbeat.isProcessing) {
      const processingTime = now - new Date(heartbeat.updatedAt).getTime();

      if (processingTime > config.maxProcessingTimeMs) {
        const alertKey = 'worker_stuck';

        if (shouldSendAlert(alertKey, config.workerStuckCooldownMs)) {
          await sendAlert(
            'Worker processing timeout',
            `Processing time: ${Math.floor(processingTime / 60000)}min\nLast update: ${heartbeat.updatedAt.toISOString()}`,
          );
        }
      }
    }
  } catch (error) {
    console.error('Worker check failed:', error);
  }
}

/**
 * 알림 전송 조건 확인
 */
function shouldSendAlert(key: string, cooldownMs: number): boolean {
  const now = Date.now();
  const lastTime = lastAlertTime.get(key) || 0;

  if (now - lastTime > cooldownMs) {
    lastAlertTime.set(key, now);
    return true;
  }

  return false;
}

/**
 * 관리자에게 알림 전송
 */
async function sendAlert(title: string, description: string): Promise<void> {
  console.log(`Alert: ${title}: ${description}`);

  try {
    const ds = await getDataSource();
    // 관리자 조회: roles에 ADMIN이 있고 kakaoAccessToken이 있는 사용자
    const admins = await ds
      .getRepository(User)
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role', 'role.name = :roleName', { roleName: 'ADMIN' })
      .where('user.kakaoAccessToken IS NOT NULL')
      .select(['user.id', 'user.name', 'user.email'])
      .getMany();

    if (admins.length === 0) {
      console.warn('No admin to receive alert.');
      return;
    }

    const baseUrl = getEnv('NEXTAUTH_URL', 'http://localhost:3000');

    await Promise.all(
      admins.map(
        (admin): Promise<boolean> =>
          sendAlertNotification({
            userId: admin.id,
            title: `System Alert: ${title}`,
            description: `${description}\n\nAdmin: ${admin.name || admin.email}\nTime: ${new Date().toISOString()}`,
            buttonText: 'Dashboard',
            buttonUrl: `${baseUrl}/dashboard`,
          }),
      ),
    );

    console.log(`Alert sent to ${admins.length} admins`);
  } catch (error) {
    console.error('Alert send failed:', error);
  }
}

/**
 * 모니터링 시작
 */
export function startHeartbeatMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }

  const config = getSettings().heartbeat;

  console.log('Heartbeat monitoring started');
  console.log(`   - Check interval: ${config.checkIntervalMs / 1000}s`);
  console.log(`   - Missed threshold: ${config.missedThreshold}`);

  monitoringInterval = setInterval(checkWorker, config.checkIntervalMs);
  checkWorker(); // 즉시 실행
}

/**
 * 모니터링 중지
 */
export function stopHeartbeatMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('Heartbeat monitoring stopped');
  }
}
