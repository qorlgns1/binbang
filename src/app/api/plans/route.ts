import { NextResponse } from 'next/server';

import { QuotaKey } from '@/generated/prisma/enums';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        quotas: {
          select: {
            key: true,
            value: true,
          },
        },
      },
      orderBy: { price: 'asc' },
    });

    // quota를 객체 형태로 변환
    const formattedPlans = plans.map((plan) => {
      const quotaMap: Record<string, number> = {};
      for (const quota of plan.quotas) {
        quotaMap[quota.key] = quota.value;
      }

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        quotas: {
          maxAccommodations: quotaMap[QuotaKey.MAX_ACCOMMODATIONS] ?? 0,
          checkIntervalMin: quotaMap[QuotaKey.CHECK_INTERVAL_MIN] ?? 60,
        },
      };
    });

    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error('Plans fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
