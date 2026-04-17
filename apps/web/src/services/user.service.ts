import { Accommodation, In, QuotaKey, Subscription, SubscriptionStatus, User, getDataSource } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export interface TutorialStatusResponse {
  shouldShow: boolean;
}

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

export async function hasKakaoToken(userId: string): Promise<boolean> {
  const ds = await getDataSource();
  const rows = await ds.query<Array<{ hasToken: number | string }>>(
    `SELECT CASE WHEN "kakaoTokenExpiry" IS NOT NULL THEN 1 ELSE 0 END AS "hasToken"
     FROM "User"
     WHERE "id" = :1
     FETCH FIRST 1 ROWS ONLY`,
    [userId],
  );

  return Number(rows[0]?.hasToken ?? 0) === 1;
}

export async function getUserQuota(userId: string): Promise<UserQuotaResponse | null> {
  const ds = await getDataSource();

  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    relations: { plan: { quotas: true } },
  });

  if (!user) return null;

  const accommodationCount = await ds.getRepository(Accommodation).count({ where: { userId } });

  const maxAccommodations = user.plan?.quotas.find((q) => q.key === QuotaKey.MAX_ACCOMMODATIONS)?.value ?? 5;
  const checkIntervalMin = user.plan?.quotas.find((q) => q.key === QuotaKey.CHECK_INTERVAL_MIN)?.value ?? 30;

  return {
    planName: user.plan?.name ?? 'FREE',
    quotas: {
      maxAccommodations,
      checkIntervalMin,
    },
    usage: {
      accommodations: accommodationCount,
    },
  };
}

export async function getUserSubscription(userId: string): Promise<UserSubscriptionResponse | null> {
  const ds = await getDataSource();

  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    relations: { plan: { quotas: true } },
  });

  if (!user) return null;

  const [accommodationCount, activeSubscription] = await Promise.all([
    ds.getRepository(Accommodation).count({ where: { userId } }),
    ds.getRepository(Subscription).findOne({
      where: {
        userId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE]),
      },
      order: { createdAt: 'DESC' },
    }),
  ]);

  const maxAccommodations = user.plan?.quotas.find((q) => q.key === QuotaKey.MAX_ACCOMMODATIONS)?.value ?? 5;
  const checkIntervalMin = user.plan?.quotas.find((q) => q.key === QuotaKey.CHECK_INTERVAL_MIN)?.value ?? 30;

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
      accommodations: accommodationCount,
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

// ============================================================================
// Tutorial
// ============================================================================

export async function getTutorialStatus(userId: string): Promise<TutorialStatusResponse | null> {
  const ds = await getDataSource();
  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    select: { tutorialCompletedAt: true, tutorialDismissedAt: true },
  });

  if (!user) return null;

  return {
    shouldShow: user.tutorialCompletedAt === null && user.tutorialDismissedAt === null,
  };
}

export async function completeTutorial(userId: string): Promise<void> {
  const ds = await getDataSource();
  await ds.getRepository(User).update({ id: userId }, { tutorialCompletedAt: new Date() });
}

export async function dismissTutorial(userId: string): Promise<void> {
  const ds = await getDataSource();
  await ds.getRepository(User).update({ id: userId }, { tutorialDismissedAt: new Date() });
}
