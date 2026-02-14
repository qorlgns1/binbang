'use client';

import { useMemo } from 'react';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { AdminFunnelResponse, FunnelRangePreset } from '@/types/admin';

interface ApiErrorShape {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
}

export async function fetchFunnel(range: FunnelRangePreset): Promise<AdminFunnelResponse> {
  const params = new URLSearchParams({ range });
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

export function useFunnelQuery(range: FunnelRangePreset): UseFunnelQueryResult {
  const filterKey = useMemo((): Record<string, string> => ({ range }), [range]);

  return useQuery({
    queryKey: adminKeys.funnelSnapshot(filterKey),
    queryFn: (): Promise<AdminFunnelResponse> => fetchFunnel(range),
    refetchInterval: 30_000,
  });
}
