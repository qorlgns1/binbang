import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import type { Prisma } from '@/generated/prisma/client';
import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import type { SettingsChangeLogEntry, SettingsChangeLogsResponse } from '@/types/admin';

const historyParamsSchema = z.object({
  settingKey: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = historyParamsSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const { settingKey, from, to, cursor, limit } = parsed.data;

    const where: Prisma.SettingsChangeLogWhereInput = {};

    if (settingKey) {
      where.settingKey = settingKey;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const logs = await prisma.settingsChangeLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        settingKey: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
        changedBy: {
          select: { id: true, name: true },
        },
      },
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;

    const response: SettingsChangeLogsResponse = {
      logs: items.map(
        (log): SettingsChangeLogEntry => ({
          id: log.id,
          settingKey: log.settingKey,
          oldValue: log.oldValue,
          newValue: log.newValue,
          changedBy: { id: log.changedBy.id, name: log.changedBy.name },
          createdAt: log.createdAt.toISOString(),
        }),
      ),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Settings history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
