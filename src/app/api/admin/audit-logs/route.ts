import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10), 1), 100);
    const action = searchParams.get('action'); // role.assign, plan.change
    const entityType = searchParams.get('entityType'); // User, Role, Plan
    const from = searchParams.get('from'); // ISO date string
    const to = searchParams.get('to'); // ISO date string

    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        (where.createdAt as Record<string, Date>).gte = new Date(from);
      }
      if (to) {
        (where.createdAt as Record<string, Date>).lte = new Date(to);
      }
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        actorId: true,
        actor: {
          select: { id: true, name: true, email: true, image: true },
        },
        targetId: true,
        targetUser: {
          select: { id: true, name: true, email: true, image: true },
        },
        entityType: true,
        action: true,
        oldValue: true,
        newValue: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    const hasNextPage = auditLogs.length > limit;
    const logs = hasNextPage ? auditLogs.slice(0, limit) : auditLogs;
    const nextCursor = hasNextPage ? logs[logs.length - 1]?.id : null;

    // 첫 페이지에서만 total 반환
    let total: number | undefined;
    if (!cursor) {
      total = await prisma.auditLog.count({ where });
    }

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        actor: log.actor
          ? { id: log.actor.id, name: log.actor.name, email: log.actor.email, image: log.actor.image }
          : null,
        targetId: log.targetId,
        targetUser: log.targetUser
          ? {
              id: log.targetUser.id,
              name: log.targetUser.name,
              email: log.targetUser.email,
              image: log.targetUser.image,
            }
          : null,
        entityType: log.entityType,
        action: log.action,
        oldValue: log.oldValue,
        newValue: log.newValue,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      })),
      nextCursor,
      ...(total !== undefined && { total }),
    });
  } catch (error) {
    console.error('Admin audit logs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
