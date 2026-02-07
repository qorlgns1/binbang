import { useQuery } from '@tanstack/react-query';

import type { ThroughputSummary } from '@/types/admin';

import { adminKeys } from './queryKeys';

interface SummaryFilterParams {
  from?: string;
  to?: string;
}

async function fetchSummary(filters: SummaryFilterParams): Promise<ThroughputSummary> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const res = await fetch(`/api/admin/throughput/summary?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch throughput summary');
  return res.json();
}

export function useThroughputSummary(filters: SummaryFilterParams = {}) {
  const filterKey: Record<string, string> = {};
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useQuery({
    queryKey: adminKeys.throughputSummary(filterKey),
    queryFn: () => fetchSummary(filters),
    refetchInterval: 30_000,
  });
}
