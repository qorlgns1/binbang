'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { adminKeys } from './queryKeys';

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

export function useAdminAuditLogs(filters: AuditLogsFilters = {}) {
  return useInfiniteQuery({
    queryKey: adminKeys.auditLogs(filters as Record<string, string>),
    queryFn: ({ pageParam }) => fetchAuditLogs({ pageParam, filters }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
