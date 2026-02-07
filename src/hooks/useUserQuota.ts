'use client';

import { useQuery } from '@tanstack/react-query';

import { userKeys } from './queryKeys';

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

async function fetchUserQuota(): Promise<UserQuotaInfo> {
  const res = await fetch('/api/user/quota');
  if (!res.ok) {
    throw new Error('사용량 정보를 불러올 수 없습니다');
  }
  return res.json();
}

export function useUserQuota() {
  return useQuery({
    queryKey: userKeys.quota(),
    queryFn: fetchUserQuota,
    staleTime: 60 * 1000, // 1분
  });
}
