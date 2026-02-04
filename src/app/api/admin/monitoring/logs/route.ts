import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import type { Prisma } from '@/generated/prisma/client';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import type { MonitoringLogEntry, MonitoringLogsResponse } from '@/types/admin';

const logsParamsSchema = z.object({
  status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'ERROR', 'UNKNOWN']).optional(),
  platform: z.enum(['AIRBNB', 'AGODA']).optional(),
  accommodationId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
});

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = logsParamsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const { status, platform, accommodationId, from, to, cursor, limit } = parsed.data;

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

    const response: MonitoringLogsResponse = {
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Monitoring logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
