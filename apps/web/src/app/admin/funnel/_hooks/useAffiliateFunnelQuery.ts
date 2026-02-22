'use client';

import { useMemo } from 'react';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { ApiErrorShape } from '@/types/api';
import type { AdminAffiliateFunnelResponse, AffiliateCategoryFilter } from '@/types/admin';

import type { FunnelQueryFilter } from './useFunnelQuery';

export interface AffiliateFunnelQueryFilter extends FunnelQueryFilter {
  category: AffiliateCategoryFilter;
}

export async function fetchAffiliateFunnel(filter: AffiliateFunnelQueryFilter): Promise<AdminAffiliateFunnelResponse> {
  const params = new URLSearchParams({
    range: filter.range,
  });

  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  if (filter.category !== 'all') params.set('category', filter.category);

  const response = await fetch(`/api/admin/funnel/affiliate?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorShape;
    const message = errorData.error?.message ?? 'Failed to fetch affiliate funnel';
    throw new Error(message);
  }

  const payload = (await response.json()) as { ok: boolean; data: AdminAffiliateFunnelResponse };
  return payload.data;
}

export type UseAffiliateFunnelQueryResult = UseQueryResult<AdminAffiliateFunnelResponse, Error>;

export function useAffiliateFunnelQuery(filter: AffiliateFunnelQueryFilter): UseAffiliateFunnelQueryResult {
  const filterKey = useMemo(
    (): Record<string, string> => ({
      range: filter.range,
      from: filter.from ?? '',
      to: filter.to ?? '',
      category: filter.category,
    }),
    [filter.category, filter.from, filter.range, filter.to],
  );

  return useQuery({
    queryKey: adminKeys.funnelAffiliateSnapshot(filterKey),
    queryFn: (): Promise<AdminAffiliateFunnelResponse> => fetchAffiliateFunnel(filter),
    refetchInterval: 30_000,
  });
}
