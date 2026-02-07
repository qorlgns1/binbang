import type { AvailabilityStatus, Platform, Prisma } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import { loadSettings } from '@/lib/settings';
import type { MonitoringLogEntry, MonitoringLogsResponse, MonitoringSummary, WorkerHealthInfo } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

export interface GetMonitoringLogsInput {
  status?: AvailabilityStatus;
  platform?: Platform;
  accommodationId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getWorkerStatus(
  lastHeartbeatAt: Date | null,
  healthyMs: number,
  degradedMs: number,
): WorkerHealthInfo['status'] {
  if (!lastHeartbeatAt) return 'down';
  const elapsed = Date.now() - lastHeartbeatAt.getTime();
  if (elapsed < healthyMs) return 'healthy';
  if (elapsed < degradedMs) return 'degraded';
  return 'down';
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getMonitoringSummary(): Promise<MonitoringSummary> {
  const settings = await loadSettings();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const [heartbeat, dbLatency, checkStats24h, recentErrors, lastSuccess, activeCount] = await Promise.all([
    prisma.workerHeartbeat.findUnique({ where: { id: 'singleton' } }),

    (async (): Promise<number> => {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      return Date.now() - start;
    })(),

    prisma.checkLog.groupBy({
      by: ['status'],
      where: { createdAt: { gte: oneDayAgo } },
      _count: { status: true },
    }),

    prisma.checkLog.findMany({
      where: { createdAt: { gte: oneHourAgo }, status: 'ERROR' },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { errorMessage: true },
    }),

    prisma.checkLog.findFirst({
      where: { status: { in: ['AVAILABLE', 'UNAVAILABLE'] } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),

    prisma.accommodation.count({ where: { isActive: true } }),
  ]);

  const errorCount1h = await prisma.checkLog.count({
    where: { createdAt: { gte: oneHourAgo }, status: 'ERROR' },
  });

  const totalChecks = checkStats24h.reduce((sum, g): number => sum + g._count.status, 0);
  const errorChecks = checkStats24h
    .filter((g): boolean => g.status === 'ERROR')
    .reduce((sum, g): number => sum + g._count.status, 0);
  const successChecks = totalChecks - errorChecks;

  return {
    worker: {
      status: getWorkerStatus(
        heartbeat?.lastHeartbeatAt ?? null,
        settings.monitoring.workerHealthyThresholdMs,
        settings.monitoring.workerDegradedThresholdMs,
      ),
      startedAt: heartbeat?.startedAt?.toISOString() ?? null,
      lastHeartbeatAt: heartbeat?.lastHeartbeatAt?.toISOString() ?? null,
      isProcessing: heartbeat?.isProcessing ?? false,
      schedule: heartbeat?.schedule ?? null,
    },
    db: {
      connected: true,
      latencyMs: dbLatency,
    },
    checkRate24h: {
      total: totalChecks,
      success: successChecks,
      error: errorChecks,
      rate: totalChecks > 0 ? Math.round((successChecks / totalChecks) * 100) : 0,
    },
    recentErrors1h: {
      count: errorCount1h,
      lastMessage: recentErrors[0]?.errorMessage ?? null,
    },
    lastSuccessfulCheck: lastSuccess?.createdAt?.toISOString() ?? null,
    activeAccommodations: activeCount,
  };
}

export async function getMonitoringLogs(input: GetMonitoringLogsInput): Promise<MonitoringLogsResponse> {
  const { status, platform, accommodationId, from, to, cursor, limit } = input;

  const where: Prisma.CheckLogWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (platform) {
    where.accommodation = { platform };
  }

  if (accommodationId) {
    where.accommodationId = accommodationId;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const logs = await prisma.checkLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      createdAt: true,
      status: true,
      price: true,
      errorMessage: true,
      notificationSent: true,
      accommodation: {
        select: {
          id: true,
          name: true,
          platform: true,
        },
      },
    },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;

  return {
    logs: items.map(
      (log): MonitoringLogEntry => ({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        status: log.status,
        price: log.price,
        errorMessage: log.errorMessage,
        notificationSent: log.notificationSent,
        accommodation: {
          id: log.accommodation.id,
          name: log.accommodation.name,
          platform: log.accommodation.platform,
        },
      }),
    ),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
