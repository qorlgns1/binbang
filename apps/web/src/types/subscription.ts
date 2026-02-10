import type { SubscriptionStatus } from '@workspace/db/enums';

export interface SubscriptionPlanInfo {
  name: string;
  description: string | null;
  price: number;
  interval: string;
}

export interface SubscriptionQuotaInfo {
  maxAccommodations: number;
  checkIntervalMin: number;
}

export interface SubscriptionUsageInfo {
  accommodations: number;
}

export interface SubscriptionDetailInfo {
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  canceledAt: string | null;
}

export interface UserSubscriptionResponse {
  plan: SubscriptionPlanInfo;
  quotas: SubscriptionQuotaInfo;
  usage: SubscriptionUsageInfo;
  subscription: SubscriptionDetailInfo | null;
}
