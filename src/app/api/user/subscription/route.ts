import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { QuotaKey } from '@/generated/prisma/enums';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: {
          select: {
            name: true,
            description: true,
            price: true,
            interval: true,
            quotas: {
              select: { key: true, value: true },
            },
          },
        },
        _count: {
          select: { accommodations: true },
        },
        subscriptions: {
          where: {
            status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            status: true,
            currentPeriodEnd: true,
            canceledAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // quota 값 추출
    const maxAccommodations = user.plan?.quotas.find((q) => q.key === QuotaKey.MAX_ACCOMMODATIONS)?.value ?? 5;
    const checkIntervalMin = user.plan?.quotas.find((q) => q.key === QuotaKey.CHECK_INTERVAL_MIN)?.value ?? 30;

    // 현재 활성 구독
    const activeSubscription = user.subscriptions[0] ?? null;

    return NextResponse.json({
      plan: {
        name: user.plan?.name ?? 'FREE',
        description: user.plan?.description ?? null,
        price: user.plan?.price ?? 0,
        interval: user.plan?.interval ?? 'month',
      },
      quotas: {
        maxAccommodations,
        checkIntervalMin,
      },
      usage: {
        accommodations: user._count.accommodations,
      },
      subscription: activeSubscription
        ? {
            status: activeSubscription.status,
            currentPeriodEnd: activeSubscription.currentPeriodEnd.toISOString(),
            canceledAt: activeSubscription.canceledAt?.toISOString() ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error('User subscription fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
