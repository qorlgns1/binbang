import { prisma } from '@workspace/db';

import { sendAlertNotification } from './notifications';
import { getSettings } from './settings';
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
    await prisma.workerHeartbeat.upsert({
      where: { id: 'singleton' },
      update: {
        lastHeartbeatAt: new Date(),
        isProcessing,
      },
      create: {
        id: 'singleton',
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
        isProcessing,
      },
    });
  } catch (error) {
    console.error('Heartbeat update failed:', error);
  }
}

// ── Heartbeat History ──

export async function recordHeartbeatHistory(
  status: 'healthy' | 'unhealthy' | 'processing',
  isProcessing: boolean,
  uptime?: number,
): Promise<void> {
  try {
    await prisma.heartbeatHistory.create({
      data: {
        status,
        isProcessing,
        uptime,
        workerId: 'singleton',
      },
    });

    // 24시간 이전 데이터 자동 정리
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    await prisma.heartbeatHistory.deleteMany({
      where: {
        timestamp: {
          lt: oneDayAgo,
        },
      },
    });
  } catch (error) {
    console.error('Heartbeat history record failed:', error);
  }
}

export async function getHeartbeatHistory(hours: number = 24): Promise<HeartbeatHistoryItem[]> {
  try {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return (await prisma.heartbeatHistory.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
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
    const heartbeat = await prisma.workerHeartbeat.findUnique({
      where: { id: 'singleton' },
    });

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
    const admins = await prisma.user.findMany({
      where: {
        roles: { some: { name: 'ADMIN' } },
        kakaoAccessToken: { not: null },
      },
      select: { id: true, name: true, email: true },
    });

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
