import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import type { ThroughputBucket, ThroughputHistoryResponse } from '@/types/admin';

const paramsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  bucketMinutes: z.coerce.number().min(1).max(1440).optional(),
});

function autoBucketMinutes(fromDate: Date, toDate: Date): number {
  const spanHours = (toDate.getTime() - fromDate.getTime()) / (60 * 60 * 1000);
  if (spanHours <= 1) return 5;
  if (spanHours <= 6) return 15;
  if (spanHours <= 24) return 30;
  return 180;
}

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

    const { from, to, bucketMinutes: customBucket } = parsed.data;

    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 24 * 60 * 60 * 1000);
    const bucketMinutes = customBucket ?? autoBucketMinutes(fromDate, toDate);
    const bucketMs = bucketMinutes * 60 * 1000;

    // CheckLog를 시간 범위 내에서 조회
    const logs = await prisma.checkLog.findMany({
      where: {
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // JS에서 시간 버킷으로 그룹핑
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

    const response: ThroughputHistoryResponse = {
      buckets,
      bucketMinutes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Throughput history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
