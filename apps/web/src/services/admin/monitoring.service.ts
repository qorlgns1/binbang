import {
  type AvailabilityStatus,
  type Platform,
  Accommodation,
  CheckLog,
  WorkerHeartbeat,
  getDataSource,
} from '@workspace/db';
import { loadWebSettings } from '@/services/web-settings.service';
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
  const settings = await loadWebSettings();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const ds = await getDataSource();

  const [heartbeat, dbLatency, checkStats24h, recentErrors, lastSuccess, activeCount] = await Promise.all([
    ds.getRepository(WorkerHeartbeat).findOne({
      where: { id: 'singleton' },
      select: { lastHeartbeatAt: true, startedAt: true, isProcessing: true, schedule: true },
    }),

    (async (): Promise<number> => {
      const start = Date.now();
      await ds.query('SELECT 1 FROM DUAL');
      return Date.now() - start;
    })(),

    ds.query<Array<{ status: string; cnt: string }>>(
      `SELECT "status", COUNT(*) AS cnt FROM "CheckLog" WHERE "createdAt" >= :1 GROUP BY "status"`,
      [oneDayAgo],
    ),

    ds.getRepository(CheckLog).find({
      where: { status: 'ERROR' as AvailabilityStatus },
      order: { createdAt: 'DESC' },
      take: 1,
      select: { errorMessage: true },
    }),

    ds.getRepository(CheckLog).findOne({
      where: [{ status: 'AVAILABLE' as AvailabilityStatus }, { status: 'UNAVAILABLE' as AvailabilityStatus }],
      order: { createdAt: 'DESC' },
      select: { createdAt: true },
    }),

    ds.getRepository(Accommodation).count({ where: { isActive: true } }),
  ]);

  const errorCount1h = await ds
    .getRepository(CheckLog)
    .createQueryBuilder('c')
    .where('c.status = :status', { status: 'ERROR' })
    .andWhere('c.createdAt >= :oneHourAgo', { oneHourAgo })
    .getCount();

  const totalChecks = checkStats24h.reduce((sum, g): number => sum + Number(g.cnt), 0);
  const errorChecks = checkStats24h
    .filter((g): boolean => g.status === 'ERROR')
    .reduce((sum, g): number => sum + Number(g.cnt), 0);
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

  const ds = await getDataSource();
  const repo = ds.getRepository(CheckLog);

  const qb = repo
    .createQueryBuilder('c')
    .innerJoinAndSelect('c.accommodation', 'acc')
    .orderBy('c.createdAt', 'DESC')
    .take(limit + 1);

  if (status) {
    qb.andWhere('c.status = :status', { status });
  }

  if (platform) {
    qb.andWhere('acc.platform = :platform', { platform });
  }

  if (accommodationId) {
    qb.andWhere('c.accommodationId = :accommodationId', { accommodationId });
  }

  if (from) {
    qb.andWhere('c.createdAt >= :from', { from: new Date(from) });
  }

  if (to) {
    qb.andWhere('c.createdAt <= :to', { to: new Date(to) });
  }

  if (cursor) {
    const cursorItem = await repo.findOne({ where: { id: cursor }, select: { id: true, createdAt: true } });
    if (cursorItem) {
      qb.andWhere('(c.createdAt < :cursorDate OR (c.createdAt = :cursorDate AND c.id < :cursorId))', {
        cursorDate: cursorItem.createdAt,
        cursorId: cursor,
      });
    }
  }

  const logs = await qb.getMany();

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
