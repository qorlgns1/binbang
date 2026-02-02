import { useInfiniteQuery } from '@tanstack/react-query';

import type { MonitoringLogsResponse } from '@/types/admin';

import { adminKeys } from './queryKeys';

interface LogsFilterParams {
  status?: string;
  platform?: string;
  from?: string;
  to?: string;
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

export function useMonitoringLogs(filters: LogsFilterParams) {
  const filterKey: Record<string, string> = {};
  if (filters.status) filterKey.status = filters.status;
  if (filters.platform) filterKey.platform = filters.platform;
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useInfiniteQuery({
    queryKey: adminKeys.logs(filterKey),
    queryFn: ({ pageParam }) => fetchLogs(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: 30_000,
  });
}
