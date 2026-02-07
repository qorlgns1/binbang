import { useQuery } from '@tanstack/react-query';

import type { MonitoringSummary } from '@/types/admin';

import { adminKeys } from './queryKeys';

async function fetchSummary(): Promise<MonitoringSummary> {
  const res = await fetch('/api/admin/monitoring/summary');
  if (!res.ok) throw new Error('Failed to fetch monitoring summary');
  return res.json();
}

export function useMonitoringSummary() {
  return useQuery({
    queryKey: adminKeys.summary(),
    queryFn: fetchSummary,
    refetchInterval: 15_000,
  });
}
