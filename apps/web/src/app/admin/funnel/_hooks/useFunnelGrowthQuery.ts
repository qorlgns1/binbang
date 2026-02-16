'use client';

import { useMemo } from 'react';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { ApiErrorShape } from '@/types/api';
import type { AdminFunnelGrowthResponse } from '@/types/admin';

import type { FunnelQueryFilter } from './useFunnelQuery';

export async function fetchFunnelGrowth(filter: FunnelQueryFilter): Promise<AdminFunnelGrowthResponse> {
  const params = new URLSearchParams({
    range: filter.range,
  });
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);

  const response = await fetch(`/api/admin/funnel/growth?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorShape;
    const message = errorData.error?.message ?? 'Failed to fetch funnel growth';
    throw new Error(message);
  }

  const payload = (await response.json()) as { ok: boolean; data: AdminFunnelGrowthResponse };
  return payload.data;
}

export type UseFunnelGrowthQueryResult = UseQueryResult<AdminFunnelGrowthResponse, Error>;

export function useFunnelGrowthQuery(filter: FunnelQueryFilter): UseFunnelGrowthQueryResult {
  const filterKey = useMemo(
    (): Record<string, string> => ({
      range: filter.range,
      from: filter.from ?? '',
      to: filter.to ?? '',
    }),
    [filter.from, filter.range, filter.to],
  );

  return useQuery({
    queryKey: adminKeys.funnelGrowthSnapshot(filterKey),
    queryFn: (): Promise<AdminFunnelGrowthResponse> => fetchFunnelGrowth(filter),
    refetchInterval: 30_000,
  });
}
