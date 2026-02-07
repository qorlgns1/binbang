import { QuotaKey } from '@/generated/prisma/enums';
import prisma from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface UserQuotaResponse {
  planName: string;
  quotas: {
    maxAccommodations: number;
    checkIntervalMin: number;
  };
  usage: {
    accommodations: number;
  };
}

export interface UserSubscriptionResponse {
  plan: {
    name: string;
    description: string | null;
    price: number;
    interval: string;
  };
  quotas: {
    maxAccommodations: number;
    checkIntervalMin: number;
  };
  usage: {
    accommodations: number;
  };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    canceledAt: string | null;
  } | null;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getUserQuota(userId: string): Promise<UserQuotaResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    return null;
  }

  const maxAccommodations = user.plan?.quotas.find((q) => q.key === QuotaKey.MAX_ACCOMMODATIONS)?.value ?? 5;
  const checkIntervalMin = user.plan?.quotas.find((q) => q.key === QuotaKey.CHECK_INTERVAL_MIN)?.value ?? 30;

  return {
    planName: user.plan?.name ?? 'FREE',
    quotas: {
      maxAccommodations,
      checkIntervalMin,
    },
    usage: {
      accommodations: user._count.accommodations,
    },
  };
}

export async function getUserSubscription(userId: string): Promise<UserSubscriptionResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    return null;
  }

  const maxAccommodations = user.plan?.quotas.find((q) => q.key === QuotaKey.MAX_ACCOMMODATIONS)?.value ?? 5;
  const checkIntervalMin = user.plan?.quotas.find((q) => q.key === QuotaKey.CHECK_INTERVAL_MIN)?.value ?? 30;
  const activeSubscription = user.subscriptions[0] ?? null;

  return {
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
  };
}
