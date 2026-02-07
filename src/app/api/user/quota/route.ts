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
            quotas: {
              select: { key: true, value: true },
            },
          },
        },
        _count: {
          select: { accommodations: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // quota 값 추출
    const maxAccommodations = user.plan?.quotas.find((q) => q.key === QuotaKey.MAX_ACCOMMODATIONS)?.value ?? 5;
    const checkIntervalMin = user.plan?.quotas.find((q) => q.key === QuotaKey.CHECK_INTERVAL_MIN)?.value ?? 30;

    return NextResponse.json({
      planName: user.plan?.name ?? 'FREE',
      quotas: {
        maxAccommodations,
        checkIntervalMin,
      },
      usage: {
        accommodations: user._count.accommodations,
      },
    });
  } catch (error) {
    console.error('User quota fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
