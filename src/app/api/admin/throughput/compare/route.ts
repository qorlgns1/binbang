import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import type { ThroughputComparisonGroup, ThroughputComparisonResponse } from '@/types/admin';

const paramsSchema = z.object({
  compareBy: z.enum(['concurrency', 'browserPoolSize']),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const avgFields = {
  durationMs: true as const,
  successCount: true as const,
  totalCount: true as const,
};

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

    const { compareBy, from, to } = parsed.data;

    const where: { startedAt?: { gte?: Date; lte?: Date }; durationMs: { not: null } } = {
      durationMs: { not: null },
    };
    if (from || to) {
      where.startedAt = {};
      if (from) where.startedAt.gte = new Date(from);
      if (to) where.startedAt.lte = new Date(to);
    }

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

    const response: ThroughputComparisonResponse = {
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Throughput compare error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
