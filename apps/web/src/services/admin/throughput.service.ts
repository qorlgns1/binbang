import prisma from '@/lib/prisma';
import type {
  ThroughputBucket,
  ThroughputComparisonGroup,
  ThroughputComparisonResponse,
  ThroughputHistoryResponse,
  ThroughputSummary,
} from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

export interface GetThroughputSummaryInput {
  from?: string;
  to?: string;
}

export interface GetThroughputHistoryInput {
  from?: string;
  to?: string;
  bucketMinutes?: number;
}

export interface GetThroughputCompareInput {
  compareBy: 'concurrency' | 'browserPoolSize';
  from?: string;
  to?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function autoBucketMinutes(fromDate: Date, toDate: Date): number {
  const spanHours = (toDate.getTime() - fromDate.getTime()) / (60 * 60 * 1000);
  if (spanHours <= 1) return 5;
  if (spanHours <= 6) return 15;
  if (spanHours <= 24) return 30;
  return 180;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getThroughputSummary(input: GetThroughputSummaryInput): Promise<ThroughputSummary> {
  const { from, to } = input;

  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [totalChecks, statusGroups, firstCheck, lastCheck, lastCycle] = await Promise.all([
    prisma.checkLog.count({ where }),
    prisma.checkLog.groupBy({ by: ['status'], where, _count: true }),
    prisma.checkLog.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    prisma.checkLog.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.checkCycle.findFirst({
      where: { startedAt: where.createdAt ? { gte: where.createdAt.gte, lte: where.createdAt.lte } : undefined },
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  const errorCount = statusGroups.filter((g) => g.status === 'ERROR').reduce((sum, g) => sum + g._count, 0);
  const successCount = totalChecks - errorCount;
  const successRate = totalChecks > 0 ? Math.round((successCount / totalChecks) * 10000) / 100 : 0;

  let avgThroughputPerMin = 0;
  const completedCycles = await prisma.checkCycle.findMany({
    where: {
      durationMs: { not: null },
      totalCount: { gt: 0 },
      ...(from || to
        ? { startedAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    },
    select: { totalCount: true, durationMs: true },
  });

  if (completedCycles.length > 0) {
    const totalThroughput = completedCycles.reduce((sum, c) => {
      const perMin = (c.totalCount / (c.durationMs as number)) * 60_000;
      return sum + perMin;
    }, 0);
    avgThroughputPerMin = Math.round((totalThroughput / completedCycles.length) * 100) / 100;
  } else {
    const timeSpanMs = lastCheck && firstCheck ? lastCheck.createdAt.getTime() - firstCheck.createdAt.getTime() : 0;
    avgThroughputPerMin = timeSpanMs > 0 ? Math.round((totalChecks / timeSpanMs) * 60_000 * 100) / 100 : 0;
  }

  return {
    totalChecks,
    successCount,
    errorCount,
    successRate,
    avgThroughputPerMin,
    lastCheckAt: lastCheck?.createdAt.toISOString() ?? null,
    lastCycle:
      lastCycle && lastCycle.durationMs
        ? {
            startedAt: lastCycle.startedAt.toISOString(),
            durationMs: lastCycle.durationMs,
            totalCount: lastCycle.totalCount,
            successCount: lastCycle.successCount,
            errorCount: lastCycle.errorCount,
            concurrency: lastCycle.concurrency,
            browserPoolSize: lastCycle.browserPoolSize,
          }
        : null,
  };
}

export async function getThroughputHistory(input: GetThroughputHistoryInput): Promise<ThroughputHistoryResponse> {
  const { from, to, bucketMinutes: customBucket } = input;

  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 24 * 60 * 60 * 1000);
  const bucketMinutes = customBucket ?? autoBucketMinutes(fromDate, toDate);
  const bucketMs = bucketMinutes * 60 * 1000;

  const logs = await prisma.checkLog.findMany({
    where: {
      createdAt: { gte: fromDate, lte: toDate },
    },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const bucketMap = new Map<number, { total: number; success: number; error: number }>();

  for (const log of logs) {
    const bucketKey = Math.floor(log.createdAt.getTime() / bucketMs) * bucketMs;
    const bucket = bucketMap.get(bucketKey) ?? { total: 0, success: 0, error: 0 };
    bucket.total++;
    if (log.status === 'ERROR') bucket.error++;
    else bucket.success++;
    bucketMap.set(bucketKey, bucket);
  }

  const buckets: ThroughputBucket[] = Array.from(bucketMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([key, val]) => ({
      bucketStart: new Date(key).toISOString(),
      totalChecks: val.total,
      successCount: val.success,
      errorCount: val.error,
      throughputPerMin: Math.round((val.total / bucketMinutes) * 100) / 100,
    }));

  return {
    buckets,
    bucketMinutes,
  };
}

export async function getThroughputCompare(input: GetThroughputCompareInput): Promise<ThroughputComparisonResponse> {
  const { compareBy, from, to } = input;

  const where: { startedAt?: { gte?: Date; lte?: Date }; durationMs: { not: null } } = {
    durationMs: { not: null },
  };
  if (from || to) {
    where.startedAt = {};
    if (from) where.startedAt.gte = new Date(from);
    if (to) where.startedAt.lte = new Date(to);
  }

  const avgFields = {
    durationMs: true as const,
    successCount: true as const,
    totalCount: true as const,
  };

  const rawGroups =
    compareBy === 'concurrency'
      ? await prisma.checkCycle.groupBy({
          by: ['concurrency'],
          where,
          _avg: avgFields,
          _count: true,
          orderBy: { concurrency: 'asc' },
        })
      : await prisma.checkCycle.groupBy({
          by: ['browserPoolSize'],
          where,
          _avg: avgFields,
          _count: true,
          orderBy: { browserPoolSize: 'asc' },
        });

  return {
    compareBy,
    groups: rawGroups.map((g): ThroughputComparisonGroup => {
      const avgTotal = g._avg.totalCount ?? 0;
      const avgSuccess = g._avg.successCount ?? 0;
      const avgDuration = g._avg.durationMs ?? 0;
      const value =
        compareBy === 'concurrency'
          ? (g as { concurrency: number }).concurrency
          : (g as { browserPoolSize: number }).browserPoolSize;
      const avgThroughputPerMin = avgDuration > 0 ? Math.round((avgTotal / avgDuration) * 60_000 * 100) / 100 : 0;
      return {
        key: compareBy,
        value,
        avgThroughputPerMin,
        avgCycleDurationMs: Math.round(avgDuration),
        avgSuccessRate: avgTotal > 0 ? Math.round((avgSuccess / avgTotal) * 10000) / 100 : 0,
        cycleCount: g._count,
      };
    }),
  };
}
