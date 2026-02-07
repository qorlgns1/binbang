import { useQuery } from '@tanstack/react-query';

import type { ThroughputHistoryResponse } from '@/types/admin';

import { adminKeys } from './queryKeys';

interface HistoryFilterParams {
  from?: string;
  to?: string;
}

async function fetchHistory(filters: HistoryFilterParams): Promise<ThroughputHistoryResponse> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const res = await fetch(`/api/admin/throughput/history?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch throughput history');
  return res.json();
}

export function useThroughputHistory(filters: HistoryFilterParams = {}) {
  const filterKey: Record<string, string> = {};
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useQuery({
    queryKey: adminKeys.throughputHistory(filterKey),
    queryFn: () => fetchHistory(filters),
    refetchInterval: 30_000,
  });
}
