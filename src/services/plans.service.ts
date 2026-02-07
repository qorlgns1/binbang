import { QuotaKey } from '@/generated/prisma/enums';
import prisma from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface PlanQuotas {
  maxAccommodations: number;
  checkIntervalMin: number;
}

export interface PublicPlanItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  quotas: PlanQuotas;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getPublicPlans(): Promise<PublicPlanItem[]> {
  const plans = await prisma.plan.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      interval: true,
      quotas: {
        select: { key: true, value: true },
      },
    },
    orderBy: { price: 'asc' },
  });

  return plans.map((plan) => {
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
}
