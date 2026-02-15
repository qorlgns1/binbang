import { prisma } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: 'connected' | 'disconnected';
      latency?: number;
      error?: string;
    };
  };
}

export interface HeartbeatResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  isHealthy: boolean;
  workerStatus: 'running' | 'stopped';
  lastHeartbeat: Date | null;
  minutesSinceLastHeartbeat: number;
  isProcessing: boolean;
  processingDuration: number;
  alerts: string[];
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getHealthStatus(isDev: boolean = false): Promise<HealthCheckResponse> {
  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: {
        status: 'disconnected',
      },
    },
  };

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'connected',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'disconnected',
      ...(isDev && {
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }

  return health;
}

export async function getHeartbeatStatus(): Promise<HeartbeatResponse> {
  const heartbeat = await prisma.workerHeartbeat.findUnique({
    where: { id: 'singleton' },
    select: { lastHeartbeatAt: true, isProcessing: true, updatedAt: true },
  });

  if (!heartbeat) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      isHealthy: false,
      workerStatus: 'stopped',
      lastHeartbeat: null,
      minutesSinceLastHeartbeat: -1,
      isProcessing: false,
      processingDuration: 0,
      alerts: ['워커 하트비트 기록 없음'],
    };
  }

  const now = new Date();
  const timeSinceLastHeartbeat = now.getTime() - new Date(heartbeat.lastHeartbeatAt).getTime();
  const minutesSinceLastHeartbeat = timeSinceLastHeartbeat / (1000 * 60);
  const intervalMs = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '60000', 10);
  const missedBeats = Math.floor(timeSinceLastHeartbeat / intervalMs);
  const missedThreshold = parseInt(process.env.HEARTBEAT_MISSED_THRESHOLD || '1', 10);

  const isHealthy = missedBeats < missedThreshold;
  const alerts: string[] = [];

  if (missedBeats >= missedThreshold) {
    alerts.push(`워커 응답 없음 (${missedBeats}회 놓침)`);
  }

  if (heartbeat.isProcessing) {
    const processingTime = now.getTime() - new Date(heartbeat.updatedAt).getTime();
    alerts.push(`워커 처리 중 (${Math.floor(processingTime / 60000)}분)`);
  }

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    isHealthy,
    workerStatus: isHealthy ? 'running' : 'stopped',
    lastHeartbeat: heartbeat.lastHeartbeatAt,
    minutesSinceLastHeartbeat,
    isProcessing: heartbeat.isProcessing,
    processingDuration: heartbeat.isProcessing ? now.getTime() - new Date(heartbeat.updatedAt).getTime() : 0,
    alerts,
  };
}
