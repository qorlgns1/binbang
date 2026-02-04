import { sendKakaoMessage } from '@/lib/kakao/message';
import prisma from '@/lib/prisma';

export { recordHeartbeatHistory, getHeartbeatHistory } from './history';

interface HeartbeatConfig {
  intervalMs: number;
  missedThreshold: number;
  checkIntervalMs: number;
}

const DEFAULT_CONFIG: HeartbeatConfig = {
  intervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '60000'),
  missedThreshold: parseInt(process.env.HEARTBEAT_MISSED_THRESHOLD || '1'),
  checkIntervalMs: parseInt(process.env.HEARTBEAT_CHECK_INTERVAL_MS || '60000'),
};

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
    console.error('❌ 하트비트 업데이트 실패:', error);
  }
}

/**
 * 워커 상태 체크 및 알림
 */
async function checkWorker(): Promise<void> {
  try {
    const heartbeat = await prisma.workerHeartbeat.findUnique({
      where: { id: 'singleton' },
    });

    if (!heartbeat) {
      await sendAlert('워커 하트비트 기록 없음', '워커가 시작되지 않았거나 DB 연결에 문제가 있습니다.');
      return;
    }

    const now = Date.now();
    const timeSinceLastHeartbeat = now - new Date(heartbeat.lastHeartbeatAt).getTime();
    const missedBeats = Math.floor(timeSinceLastHeartbeat / DEFAULT_CONFIG.intervalMs);

    // console.log(`💓 하트비트 체크: ${Math.floor(timeSinceLastHeartbeat / 1000)}초 전, 놓침: ${missedBeats}`);

    // 워커 다운 감지
    if (missedBeats >= DEFAULT_CONFIG.missedThreshold) {
      const alertKey = 'worker_down';
      const cooldown = 60 * 60 * 1000; // 1시간

      if (shouldSendAlert(alertKey, cooldown)) {
        await sendAlert(
          `워커 응답 없음 (${missedBeats}회 놓침)`,
          `마지막 하트비트: ${heartbeat.lastHeartbeatAt.toISOString()}\n예상 간격: ${DEFAULT_CONFIG.intervalMs / 1000}초`,
        );
      }
    }

    // 처리 시간 초과 감지
    if (heartbeat.isProcessing) {
      const processingTime = now - new Date(heartbeat.updatedAt).getTime();
      const maxProcessingTime = 60 * 60 * 1000; // 1시간

      if (processingTime > maxProcessingTime) {
        const alertKey = 'worker_stuck';
        const cooldown = 30 * 60 * 1000; // 30분

        if (shouldSendAlert(alertKey, cooldown)) {
          await sendAlert(
            '워커 처리 시간 초과',
            `처리 시간: ${Math.floor(processingTime / 60000)}분\n마지막 업데이트: ${heartbeat.updatedAt.toISOString()}`,
          );
        }
      }
    }
  } catch (error) {
    console.error('❌ 워커 체크 실패:', error);
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
  console.log(`🚨 ${title}: ${description}`);

  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        kakaoAccessToken: { not: null },
      },
      select: { id: true, name: true, email: true },
    });

    if (admins.length === 0) {
      console.warn('⚠️ 알림을 받을 관리자가 없습니다.');
      return;
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    await Promise.all(
      admins.map((admin) =>
        sendKakaoMessage({
          userId: admin.id,
          title: `🚨 시스템 알림: ${title}`,
          description: `${description}\n\n관리자: ${admin.name || admin.email}\n시간: ${new Date().toISOString()}`,
          buttonText: '대시보드',
          buttonUrl: `${baseUrl}/dashboard`,
        }),
      ),
    );

    console.log(`✅ ${admins.length}명에게 알림 전송 완료`);
  } catch (error) {
    console.error('❌ 알림 전송 실패:', error);
  }
}

/**
 * 모니터링 시작
 */
export function startHeartbeatMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }

  console.log('🔍 하트비트 모니터링 시작');
  console.log(`   - 체크 간격: ${DEFAULT_CONFIG.checkIntervalMs / 1000}초`);
  console.log(`   - 놓침 기준: ${DEFAULT_CONFIG.missedThreshold}회`);

  monitoringInterval = setInterval(checkWorker, DEFAULT_CONFIG.checkIntervalMs);
  checkWorker(); // 즉시 실행
}

/**
 * 모니터링 중지
 */
export function stopHeartbeatMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('🛑 하트비트 모니터링 중지');
  }
}
