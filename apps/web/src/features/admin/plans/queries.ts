/**
 * 관리자 - 플랜 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import type { QuotaKey } from '@workspace/db/enums';
import { adminKeys } from '@/lib/queryKeys';

// ============================================================================
// Types
// ============================================================================

export interface AdminPlanInfo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  quotas: { key: QuotaKey; value: number }[];
  _count: { users: number };
}

export type UseAdminPlansQueryResult = UseQueryResult<AdminPlanInfo[], Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchPlans(): Promise<AdminPlanInfo[]> {
  const res = await fetch('/api/admin/plans');
  if (!res.ok) {
    throw new Error('플랜 목록을 불러올 수 없습니다');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useAdminPlansQuery(): UseAdminPlansQueryResult {
  return useQuery({
    queryKey: adminKeys.plans(),
    queryFn: fetchPlans,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
