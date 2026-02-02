'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { logKeys } from '@/hooks/queryKeys';
import type { RecentLog } from '@/hooks/types';

async function fetchRecentLogs(): Promise<RecentLog[]> {
  const res = await fetch('/api/logs/recent');
  if (!res.ok) {
    throw new Error('최근 로그를 불러올 수 없습니다');
  }
  return res.json();
}

export function useRecentLogs() {
  return useQuery({
    queryKey: logKeys.recent(),
    queryFn: fetchRecentLogs,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
}
