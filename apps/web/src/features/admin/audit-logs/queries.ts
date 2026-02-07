/**
 * 관리자 - 감사 로그 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type InfiniteData, type UseInfiniteQueryResult, useInfiniteQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';

// ============================================================================
// Types
// ============================================================================

interface AuditLogUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface AuditLogInfo {
  id: string;
  actorId: string | null;
  actor: AuditLogUser | null;
  targetId: string;
  targetUser: AuditLogUser | null;
  entityType: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogsResponse {
  logs: AuditLogInfo[];
  nextCursor: string | null;
  total?: number;
}

interface AuditLogsFilters {
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

export type UseAuditLogsInfiniteQueryResult = UseInfiniteQueryResult<InfiniteData<AuditLogsResponse>, Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchAuditLogs({
  pageParam,
  filters,
}: {
  pageParam: string | null;
  filters: AuditLogsFilters;
}): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);
  if (filters.action) params.set('action', filters.action);
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
  if (!res.ok) {
    throw new Error('감사 로그를 불러올 수 없습니다');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useAuditLogsInfiniteQuery(filters: AuditLogsFilters = {}): UseAuditLogsInfiniteQueryResult {
  return useInfiniteQuery({
    queryKey: adminKeys.auditLogs(filters as Record<string, string>),
    queryFn: ({ pageParam }: { pageParam: string | null }): Promise<AuditLogsResponse> =>
      fetchAuditLogs({ pageParam, filters }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: AuditLogsResponse): string | null => lastPage.nextCursor,
  });
}
