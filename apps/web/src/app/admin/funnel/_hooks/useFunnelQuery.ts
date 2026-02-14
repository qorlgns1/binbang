'use client';

import { useMemo } from 'react';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { ApiErrorShape } from '@/types/api';
import type { AdminFunnelResponse, FunnelRangePreset } from '@/types/admin';

export interface FunnelQueryFilter {
  range: FunnelRangePreset;
  from?: string;
  to?: string;
}

export async function fetchFunnel(filter: FunnelQueryFilter): Promise<AdminFunnelResponse> {
  const params = new URLSearchParams({
    range: filter.range,
  });
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  const response = await fetch(`/api/admin/funnel?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorShape;
    const message = errorData.error?.message ?? 'Failed to fetch admin funnel';
    throw new Error(message);
  }

  const payload = (await response.json()) as { ok: boolean; data: AdminFunnelResponse };
  return payload.data;
}

export type UseFunnelQueryResult = UseQueryResult<AdminFunnelResponse, Error>;

export function useFunnelQuery(filter: FunnelQueryFilter): UseFunnelQueryResult {
  const filterKey = useMemo(
    (): Record<string, string> => ({
      range: filter.range,
      from: filter.from ?? '',
      to: filter.to ?? '',
    }),
    [filter.from, filter.range, filter.to],
  );

  return useQuery({
    queryKey: adminKeys.funnelSnapshot(filterKey),
    queryFn: (): Promise<AdminFunnelResponse> => fetchFunnel(filter),
    refetchInterval: 30_000,
  });
}
