/**
 * 관리자 - 모니터링 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { MonitoringLogsResponse, MonitoringSummary, QueueSnapshotResponse } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

interface LogsFilterParams {
  status?: string;
  platform?: string;
  from?: string;
  to?: string;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload !== 'object' || payload === null) return fallback;

  const data = payload as { error?: unknown; message?: unknown };
  if (typeof data.error === 'string') return data.error;

  if (typeof data.error === 'object' && data.error !== null) {
    const nested = data.error as { message?: unknown };
    if (typeof nested.message === 'string') return nested.message;
  }

  if (typeof data.message === 'string') return data.message;
  return fallback;
}

export type UseMonitoringSummaryQueryResult = UseQueryResult<MonitoringSummary, Error>;
export type UseMonitoringLogsInfiniteQueryResult = UseInfiniteQueryResult<InfiniteData<MonitoringLogsResponse>, Error>;
export type UseWorkerQueueQueryResult = UseQueryResult<QueueSnapshotResponse, Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchSummary(): Promise<MonitoringSummary> {
  const res = await fetch('/api/admin/monitoring/summary');
  if (!res.ok) throw new Error('Failed to fetch monitoring summary');
  return res.json();
}

async function fetchLogs(filters: LogsFilterParams, cursor?: string): Promise<MonitoringLogsResponse> {
  const params = new URLSearchParams();

  if (filters.status) params.set('status', filters.status);
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/admin/monitoring/logs?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch monitoring logs');
  return res.json();
}

async function fetchWorkerQueue(limit: number): Promise<QueueSnapshotResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));

  const res = await fetch(`/api/admin/worker/queue?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const errorData = await res.json().catch((): null => null);
    throw new Error(extractErrorMessage(errorData, '워커 큐 스냅샷을 가져오지 못했습니다.'));
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useMonitoringSummaryQuery(): UseMonitoringSummaryQueryResult {
  return useQuery({
    queryKey: adminKeys.summary(),
    queryFn: fetchSummary,
    refetchInterval: 15_000,
  });
}

export function useMonitoringLogsInfiniteQuery(filters: LogsFilterParams): UseMonitoringLogsInfiniteQueryResult {
  const filterKey: Record<string, string> = {};
  if (filters.status) filterKey.status = filters.status;
  if (filters.platform) filterKey.platform = filters.platform;
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useInfiniteQuery({
    queryKey: adminKeys.logs(filterKey),
    queryFn: ({ pageParam }: { pageParam: string | undefined }): Promise<MonitoringLogsResponse> =>
      fetchLogs(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: MonitoringLogsResponse): string | undefined => lastPage.nextCursor ?? undefined,
    refetchInterval: 30_000,
  });
}

export function useWorkerQueueQuery(limit: number = 20): UseWorkerQueueQueryResult {
  const safeLimit = Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : 20;

  return useQuery({
    queryKey: adminKeys.workerQueue({ limit: String(safeLimit) }),
    queryFn: (): Promise<QueueSnapshotResponse> => fetchWorkerQueue(safeLimit),
    refetchInterval: 3000,
    staleTime: 1000,
  });
}
