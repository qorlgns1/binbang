'use client';

import { useMemo } from 'react';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { ApiErrorShape } from '@/types/api';
import type { AdminFunnelClicksResponse } from '@/types/admin';

import type { FunnelQueryFilter } from './useFunnelQuery';

export async function fetchFunnelClicks(filter: FunnelQueryFilter): Promise<AdminFunnelClicksResponse> {
  const params = new URLSearchParams({
    range: filter.range,
  });
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);

  const response = await fetch(`/api/admin/funnel/clicks?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorShape;
    const message = errorData.error?.message ?? 'Failed to fetch funnel clicks';
    throw new Error(message);
  }

  const payload = (await response.json()) as { ok: boolean; data: AdminFunnelClicksResponse };
  return payload.data;
}

export type UseFunnelClicksQueryResult = UseQueryResult<AdminFunnelClicksResponse, Error>;

export function useFunnelClicksQuery(filter: FunnelQueryFilter): UseFunnelClicksQueryResult {
  const filterKey = useMemo(
    (): Record<string, string> => ({
      range: filter.range,
      from: filter.from ?? '',
      to: filter.to ?? '',
    }),
    [filter.from, filter.range, filter.to],
  );

  return useQuery({
    queryKey: adminKeys.funnelClicksSnapshot(filterKey),
    queryFn: (): Promise<AdminFunnelClicksResponse> => fetchFunnelClicks(filter),
    refetchInterval: 30_000,
  });
}
