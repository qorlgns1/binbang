'use client';

import { useQuery } from '@tanstack/react-query';

import type { UserSubscriptionResponse } from '@/types/subscription';

import { userKeys } from './queryKeys';

async function fetchUserSubscription(): Promise<UserSubscriptionResponse> {
  const res = await fetch('/api/user/subscription');
  if (!res.ok) {
    throw new Error('구독 정보를 불러올 수 없습니다');
  }
  return res.json();
}

export function useUserSubscription() {
  return useQuery({
    queryKey: userKeys.subscription(),
    queryFn: fetchUserSubscription,
    staleTime: 60 * 1000, // 1분
  });
}
