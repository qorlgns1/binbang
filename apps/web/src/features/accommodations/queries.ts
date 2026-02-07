/**
 * 숙소 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { accommodationKeys } from '@/lib/queryKeys';
import type { Accommodation, CheckLogsPage, PriceHistoryResponse } from '@/types/accommodation';

// ============================================================================
// Types
// ============================================================================

interface PriceHistoryFilters {
  from?: string;
  to?: string;
}

export type UseAccommodationQueryResult = UseQueryResult<Accommodation, Error>;
export type UseAccommodationsQueryResult = UseQueryResult<Accommodation[], Error>;
export type UseCheckLogsInfiniteQueryResult = UseInfiniteQueryResult<InfiniteData<CheckLogsPage>, Error>;
export type UsePriceHistoryQueryResult = UseQueryResult<PriceHistoryResponse, Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchAccommodation(id: string): Promise<Accommodation> {
  const res = await fetch(`/api/accommodations/${id}`);
  if (!res.ok) {
    throw new Error('숙소 정보를 불러올 수 없습니다');
  }
  return res.json();
}

async function fetchAccommodations(): Promise<Accommodation[]> {
  const res = await fetch('/api/accommodations');
  if (!res.ok) {
    throw new Error('숙소 목록을 불러올 수 없습니다');
  }
  return res.json();
}

async function fetchCheckLogs(accommodationId: string, cursor?: string): Promise<CheckLogsPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/accommodations/${accommodationId}/logs?${params}`);
  if (!res.ok) {
    throw new Error('체크 로그를 불러올 수 없습니다');
  }
  return res.json();
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

// ============================================================================
// Hooks
// ============================================================================

export function useAccommodationQuery(id: string): UseAccommodationQueryResult {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: accommodationKeys.detail(id),
    queryFn: (): Promise<Accommodation> => fetchAccommodation(id),
    enabled: !!id,
    placeholderData: (): Accommodation | undefined => {
      const list = queryClient.getQueryData<Accommodation[]>(accommodationKeys.lists());
      return list?.find((a: Accommodation): boolean => a.id === id);
    },
  });
}

export function useAccommodationsQuery(): UseAccommodationsQueryResult {
  return useQuery({
    queryKey: accommodationKeys.lists(),
    queryFn: fetchAccommodations,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCheckLogsInfiniteQuery(accommodationId: string): UseCheckLogsInfiniteQueryResult {
  return useInfiniteQuery({
    queryKey: accommodationKeys.logs(accommodationId),
    queryFn: ({ pageParam }): Promise<CheckLogsPage> => fetchCheckLogs(accommodationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage): string | undefined => lastPage.nextCursor ?? undefined,
    enabled: !!accommodationId,
  });
}

export function usePriceHistoryQuery(
  accommodationId: string,
  filters: PriceHistoryFilters = {},
): UsePriceHistoryQueryResult {
  const filterKey: Record<string, string> = {};
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useQuery({
    queryKey: accommodationKeys.prices(accommodationId, filterKey),
    queryFn: (): Promise<PriceHistoryResponse> => fetchPriceHistory(accommodationId, filters),
  });
}
