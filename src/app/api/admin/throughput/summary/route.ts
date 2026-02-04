import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import type { ThroughputSummary } from '@/types/admin';

const paramsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = paramsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const { from, to } = parsed.data;

    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    // CheckLog 기반 집계
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

    // 처리량 계산: CheckCycle 기반 (워커 비활성 시간 제외)
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
      // CheckCycle 데이터가 없으면 전체 시간 범위 기반 fallback
      const timeSpanMs = lastCheck && firstCheck ? lastCheck.createdAt.getTime() - firstCheck.createdAt.getTime() : 0;
      avgThroughputPerMin = timeSpanMs > 0 ? Math.round((totalChecks / timeSpanMs) * 60_000 * 100) / 100 : 0;
    }

    const response: ThroughputSummary = {
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Throughput summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
