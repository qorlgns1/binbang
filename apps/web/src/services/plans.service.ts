import { Plan, QuotaKey, getDataSource } from '@workspace/db';

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
  const ds = await getDataSource();
  const plans = await ds.getRepository(Plan).find({
    relations: { quotas: true },
    order: { price: 'ASC' },
  });

  return plans.map((plan): PublicPlanItem => {
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
