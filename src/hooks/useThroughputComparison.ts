import { useQuery } from '@tanstack/react-query';

import type { ThroughputComparisonResponse } from '@/types/admin';

import { adminKeys } from './queryKeys';

interface ComparisonFilterParams {
  compareBy: 'concurrency' | 'browserPoolSize';
  from?: string;
  to?: string;
}

async function fetchComparison(filters: ComparisonFilterParams): Promise<ThroughputComparisonResponse> {
  const params = new URLSearchParams();
  params.set('compareBy', filters.compareBy);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const res = await fetch(`/api/admin/throughput/compare?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch throughput comparison');
  return res.json();
}

export function useThroughputComparison(filters: ComparisonFilterParams) {
  const filterKey: Record<string, string> = { compareBy: filters.compareBy };
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useQuery({
    queryKey: adminKeys.throughputComparison(filterKey),
    queryFn: () => fetchComparison(filters),
    refetchInterval: 60_000,
  });
}
