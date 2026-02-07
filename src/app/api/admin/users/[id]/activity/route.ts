import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import type { ActivityType, UserActivityItem } from '@/types/activity';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10), 1), 100);
    const typeFilter = searchParams.get('type') as ActivityType | 'all' | null;

    // 사용자 존재 확인
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const activities: UserActivityItem[] = [];

    // 커서 파싱 (type:id:createdAt)
    let cursorDate: Date | null = null;
    let cursorType: string | null = null;
    let cursorId: string | null = null;
    if (cursor) {
      const parts = cursor.split(':');
      if (parts.length === 3) {
        cursorType = parts[0];
        cursorId = parts[1];
        cursorDate = new Date(parts[2]);
      }
    }

    // 각 데이터 소스에서 가져오기
    const shouldFetchAudit = !typeFilter || typeFilter === 'all' || typeFilter === 'audit';
    const shouldFetchCheck = !typeFilter || typeFilter === 'all' || typeFilter === 'check';
    const shouldFetchAccommodation = !typeFilter || typeFilter === 'all' || typeFilter === 'accommodation';

    // AuditLog (targetId = userId)
    if (shouldFetchAudit) {
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          targetId: userId,
          ...(cursorDate && cursorType === 'audit' && cursorId
            ? {
                OR: [{ createdAt: { lt: cursorDate } }, { createdAt: cursorDate, id: { lt: cursorId } }],
              }
            : cursorDate
              ? { createdAt: { lte: cursorDate } }
              : {}),
        },
        take: limit + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          action: true,
          oldValue: true,
          newValue: true,
          createdAt: true,
          actor: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      for (const log of auditLogs) {
        activities.push({
          id: `audit:${log.id}`,
          type: 'audit',
          action: log.action,
          createdAt: log.createdAt.toISOString(),
          actor: log.actor,
          oldValue: log.oldValue,
          newValue: log.newValue,
        });
      }
    }

    // CheckLog (userId)
    if (shouldFetchCheck) {
      const checkLogs = await prisma.checkLog.findMany({
        where: {
          userId,
          ...(cursorDate && cursorType === 'check' && cursorId
            ? {
                OR: [{ createdAt: { lt: cursorDate } }, { createdAt: cursorDate, id: { lt: cursorId } }],
              }
            : cursorDate
              ? { createdAt: { lte: cursorDate } }
              : {}),
        },
        take: limit + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          status: true,
          price: true,
          createdAt: true,
          accommodation: {
            select: { id: true, name: true, platform: true },
          },
        },
      });

      for (const log of checkLogs) {
        activities.push({
          id: `check:${log.id}`,
          type: 'check',
          action: 'check',
          createdAt: log.createdAt.toISOString(),
          status: log.status,
          price: log.price,
          accommodation: log.accommodation,
        });
      }
    }

    // Accommodation 생성 (userId, createdAt)
    if (shouldFetchAccommodation) {
      const accommodations = await prisma.accommodation.findMany({
        where: {
          userId,
          ...(cursorDate && cursorType === 'accommodation' && cursorId
            ? {
                OR: [{ createdAt: { lt: cursorDate } }, { createdAt: cursorDate, id: { lt: cursorId } }],
              }
            : cursorDate
              ? { createdAt: { lte: cursorDate } }
              : {}),
        },
        take: limit + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          name: true,
          platform: true,
          createdAt: true,
        },
      });

      for (const acc of accommodations) {
        activities.push({
          id: `accommodation:${acc.id}`,
          type: 'accommodation',
          action: 'accommodation.create',
          createdAt: acc.createdAt.toISOString(),
          accommodationName: acc.name,
          platform: acc.platform,
        });
      }
    }

    // 시간순 정렬 (최신순)
    activities.sort((a, b) => {
      const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });

    // limit 적용
    const hasNextPage = activities.length > limit;
    const resultActivities = activities.slice(0, limit);

    // 다음 커서 생성
    let nextCursor: string | null = null;
    if (hasNextPage && resultActivities.length > 0) {
      const lastItem = resultActivities[resultActivities.length - 1];
      const [type, id] = lastItem.id.split(':');
      nextCursor = `${type}:${id}:${lastItem.createdAt}`;
    }

    // 첫 페이지에서만 total 반환
    let total: number | undefined;
    if (!cursor) {
      const [auditCount, checkCount, accCount] = await Promise.all([
        shouldFetchAudit ? prisma.auditLog.count({ where: { targetId: userId } }) : 0,
        shouldFetchCheck ? prisma.checkLog.count({ where: { userId } }) : 0,
        shouldFetchAccommodation ? prisma.accommodation.count({ where: { userId } }) : 0,
      ]);
      total = auditCount + checkCount + accCount;
    }

    return NextResponse.json({
      activities: resultActivities,
      nextCursor,
      ...(total !== undefined && { total }),
    });
  } catch (error) {
    console.error('Admin user activity fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
