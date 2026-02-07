import { useQuery } from '@tanstack/react-query';

import type { PriceHistoryResponse } from '@/types/accommodation';

import { accommodationKeys } from './queryKeys';

interface PriceHistoryFilters {
  from?: string;
  to?: string;
}

async function fetchPriceHistory(id: string, filters: PriceHistoryFilters): Promise<PriceHistoryResponse> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const qs = params.toString();
  const res = await fetch(`/api/accommodations/${id}/prices${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch price history');
  return res.json();
}

export function usePriceHistory(accommodationId: string, filters: PriceHistoryFilters = {}) {
  const filterKey: Record<string, string> = {};
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useQuery({
    queryKey: accommodationKeys.prices(accommodationId, filterKey),
    queryFn: () => fetchPriceHistory(accommodationId, filters),
  });
}
