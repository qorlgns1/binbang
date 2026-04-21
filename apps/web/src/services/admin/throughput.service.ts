import {
  Between,
  CheckCycle,
  CheckLog,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  getDataSource,
} from '@workspace/db';
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
  if (spanHours <= 1) return 2;
  if (spanHours <= 6) return 10;
  if (spanHours <= 24) return 30;
  return 180;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getThroughputSummary(input: GetThroughputSummaryInput): Promise<ThroughputSummary> {
  const { from, to } = input;

  const ds = await getDataSource();
  const checkLogRepo = ds.getRepository(CheckLog);
  const checkCycleRepo = ds.getRepository(CheckCycle);

  const dateOp =
    from && to
      ? Between(new Date(from), new Date(to))
      : from
        ? MoreThanOrEqual(new Date(from))
        : to
          ? LessThanOrEqual(new Date(to))
          : undefined;
  const checkLogWhere = dateOp ? { createdAt: dateOp } : {};
  const cycleDateWhere = dateOp ? { startedAt: dateOp } : {};

  const [totalChecks, statusGroups, firstCheck, lastCheck, lastCycle] = await Promise.all([
    checkLogRepo.count({ where: checkLogWhere }),
    // groupBy status → Oracle raw SQL
    (async () => {
      const params: unknown[] = [];
      let whereClause = '';
      if (from && to) {
        whereClause = ' WHERE "createdAt" >= :1 AND "createdAt" <= :2';
        params.push(new Date(from), new Date(to));
      } else if (from) {
        whereClause = ' WHERE "createdAt" >= :1';
        params.push(new Date(from));
      } else if (to) {
        whereClause = ' WHERE "createdAt" <= :1';
        params.push(new Date(to));
      }
      return ds.query<Array<{ status: string; cnt: string }>>(
        `SELECT "status", COUNT(*) AS cnt FROM "CheckLog"${whereClause} GROUP BY "status"`,
        params,
      );
    })(),
    checkLogRepo.findOne({ where: checkLogWhere, order: { createdAt: 'ASC' }, select: { createdAt: true } }),
    checkLogRepo.findOne({ where: checkLogWhere, order: { createdAt: 'DESC' }, select: { createdAt: true } }),
    checkCycleRepo.findOne({
      where: { ...cycleDateWhere },
      order: { startedAt: 'DESC' },
      select: {
        startedAt: true,
        durationMs: true,
        totalCount: true,
        successCount: true,
        errorCount: true,
        concurrency: true,
        browserPoolSize: true,
      },
    }),
  ]);

  const errorCount = statusGroups.filter((g) => g.status === 'ERROR').reduce((sum, g) => sum + Number(g.cnt), 0);
  const successCount = totalChecks - errorCount;
  const successRate = totalChecks > 0 ? Math.round((successCount / totalChecks) * 10000) / 100 : 0;

  let avgThroughputPerMin = 0;
  const completedCycles = await checkCycleRepo.find({
    where: {
      durationMs: Not(IsNull()),
      totalCount: MoreThan(0),
      ...cycleDateWhere,
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
    lastCycle: lastCycle?.durationMs
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

  const ds = await getDataSource();
  const logs = await ds.getRepository(CheckLog).find({
    where: {
      createdAt: Between(fromDate, toDate),
    },
    select: { createdAt: true, status: true },
    order: { createdAt: 'ASC' },
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
    .sort(([a]: [number, unknown], [b]: [number, unknown]): number => a - b)
    .map(
      ([key, val]: [number, { total: number; success: number; error: number }]): ThroughputBucket => ({
        bucketStart: new Date(key).toISOString(),
        totalChecks: val.total,
        successCount: val.success,
        errorCount: val.error,
        throughputPerMin: Math.round((val.total / bucketMinutes) * 100) / 100,
      }),
    );

  return {
    buckets,
    bucketMinutes,
  };
}

export async function getThroughputCompare(input: GetThroughputCompareInput): Promise<ThroughputComparisonResponse> {
  const { compareBy, from, to } = input;

  const ds = await getDataSource();

  const params: unknown[] = [];
  let whereClause = 'WHERE "durationMs" IS NOT NULL';
  if (from) {
    params.push(new Date(from));
    whereClause += ` AND "startedAt" >= :${params.length}`;
  }
  if (to) {
    params.push(new Date(to));
    whereClause += ` AND "startedAt" <= :${params.length}`;
  }

  const groupCol = compareBy === 'concurrency' ? '"concurrency"' : '"browserPoolSize"';

  const rawGroups = await ds.query<
    Array<{
      groupVal: number;
      avgDurationMs: string | null;
      avgSuccessCount: string | null;
      avgTotalCount: string | null;
      cnt: string;
    }>
  >(
    `SELECT ${groupCol} AS "groupVal", AVG("durationMs") AS "avgDurationMs", AVG("successCount") AS "avgSuccessCount", AVG("totalCount") AS "avgTotalCount", COUNT(*) AS cnt FROM "CheckCycle" ${whereClause} GROUP BY ${groupCol} ORDER BY ${groupCol} ASC`,
    params,
  );

  return {
    compareBy,
    groups: rawGroups.map((g): ThroughputComparisonGroup => {
      const avgTotal = Number(g.avgTotalCount ?? 0);
      const avgSuccess = Number(g.avgSuccessCount ?? 0);
      const avgDuration = Number(g.avgDurationMs ?? 0);
      const value = Number(g.groupVal);
      const avgThroughputPerMin = avgDuration > 0 ? Math.round((avgTotal / avgDuration) * 60_000 * 100) / 100 : 0;
      return {
        key: compareBy,
        value,
        avgThroughputPerMin,
        avgCycleDurationMs: Math.round(avgDuration),
        avgSuccessRate: avgTotal > 0 ? Math.round((avgSuccess / avgTotal) * 10000) / 100 : 0,
        cycleCount: Number(g.cnt),
      };
    }),
  };
}
