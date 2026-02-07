/**
 * 플랜 관련 queries (공개)
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { planKeys } from '@/lib/queryKeys';

// ============================================================================
// Types
// ============================================================================

export interface PlanInfo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  quotas: {
    maxAccommodations: number;
    checkIntervalMin: number;
  };
}

export type UsePlansQueryResult = UseQueryResult<PlanInfo[], Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchPlans(): Promise<PlanInfo[]> {
  const res = await fetch('/api/plans');
  if (!res.ok) {
    throw new Error('플랜 정보를 불러올 수 없습니다');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function usePlansQuery(): UsePlansQueryResult {
  return useQuery({
    queryKey: planKeys.list(),
    queryFn: fetchPlans,
    staleTime: 10 * 60 * 1000, // 10분
  });
}
