/**
 * 사용자 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { userKeys } from '@/lib/queryKeys';
import type { UserSubscriptionResponse } from '@/types/subscription';

// ============================================================================
// Types
// ============================================================================

export interface UserQuotaInfo {
  planName: string;
  quotas: {
    maxAccommodations: number;
    checkIntervalMin: number;
  };
  usage: {
    accommodations: number;
  };
}

export type UseUserQuotaQueryResult = UseQueryResult<UserQuotaInfo, Error>;
export type UseUserSubscriptionQueryResult = UseQueryResult<UserSubscriptionResponse, Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchUserQuota(): Promise<UserQuotaInfo> {
  const res = await fetch('/api/user/quota');
  if (!res.ok) {
    throw new Error('사용량 정보를 불러올 수 없습니다');
  }
  return res.json();
}

async function fetchUserSubscription(): Promise<UserSubscriptionResponse> {
  const res = await fetch('/api/user/subscription');
  if (!res.ok) {
    throw new Error('구독 정보를 불러올 수 없습니다');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useUserQuotaQuery(): UseUserQuotaQueryResult {
  return useQuery({
    queryKey: userKeys.quota(),
    queryFn: fetchUserQuota,
    staleTime: 60 * 1000, // 1분
  });
}

export function useUserSubscriptionQuery(): UseUserSubscriptionQueryResult {
  return useQuery({
    queryKey: userKeys.subscription(),
    queryFn: fetchUserSubscription,
    staleTime: 60 * 1000, // 1분
  });
}
