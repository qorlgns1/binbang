/**
 * 로그 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';

import { logKeys } from '@/lib/queryKeys';
import type { RecentLog } from '@/types/accommodation';

// ============================================================================
// Types
// ============================================================================

export type UseRecentLogsQueryResult = UseQueryResult<RecentLog[], Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchRecentLogs(): Promise<RecentLog[]> {
  const res = await fetch('/api/logs/recent');
  if (!res.ok) {
    throw new Error('최근 로그를 불러올 수 없습니다');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useRecentLogsQuery(): UseRecentLogsQueryResult {
  return useQuery({
    queryKey: logKeys.recent(),
    queryFn: fetchRecentLogs,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  });
}
