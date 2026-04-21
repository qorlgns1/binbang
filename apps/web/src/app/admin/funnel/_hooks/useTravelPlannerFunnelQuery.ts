'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { ApiErrorShape } from '@/types/api';
import type { AdminTravelPlannerFunnelResponse } from '@/types/admin';

export async function fetchTravelPlannerFunnel(): Promise<AdminTravelPlannerFunnelResponse> {
  const response = await fetch('/api/admin/funnel/travel-planner', {
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiErrorShape;
    const message = errorData.error?.message ?? 'Failed to fetch travel planner funnel';
    throw new Error(message);
  }

  const payload = (await response.json()) as { ok: boolean; data: AdminTravelPlannerFunnelResponse };
  return payload.data;
}

export type UseTravelPlannerFunnelQueryResult = UseQueryResult<AdminTravelPlannerFunnelResponse, Error>;

export function useTravelPlannerFunnelQuery(): UseTravelPlannerFunnelQueryResult {
  return useQuery({
    queryKey: adminKeys.travelPlannerFunnelSnapshot(),
    queryFn: fetchTravelPlannerFunnel,
    refetchInterval: 30_000,
  });
}
