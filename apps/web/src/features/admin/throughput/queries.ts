/**
 * 관리자 - 처리량 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { ThroughputComparisonResponse, ThroughputHistoryResponse, ThroughputSummary } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

interface SummaryFilterParams {
  from?: string;
  to?: string;
}

interface HistoryFilterParams {
  from?: string;
  to?: string;
}

interface ComparisonFilterParams {
  compareBy: 'concurrency' | 'browserPoolSize';
  from?: string;
  to?: string;
}

export type UseThroughputSummaryQueryResult = UseQueryResult<ThroughputSummary, Error>;
export type UseThroughputHistoryQueryResult = UseQueryResult<ThroughputHistoryResponse, Error>;
export type UseThroughputComparisonQueryResult = UseQueryResult<ThroughputComparisonResponse, Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchSummary(filters: SummaryFilterParams): Promise<ThroughputSummary> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const res = await fetch(`/api/admin/throughput/summary?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch throughput summary');
  return res.json();
}

async function fetchHistory(filters: HistoryFilterParams): Promise<ThroughputHistoryResponse> {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const res = await fetch(`/api/admin/throughput/history?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch throughput history');
  return res.json();
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

// ============================================================================
// Hooks
// ============================================================================

export function useThroughputSummaryQuery(filters: SummaryFilterParams = {}): UseThroughputSummaryQueryResult {
  const filterKey: Record<string, string> = {};
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useQuery({
    queryKey: adminKeys.throughputSummary(filterKey),
    queryFn: (): Promise<ThroughputSummary> => fetchSummary(filters),
    refetchInterval: 30_000,
  });
}

export function useThroughputHistoryQuery(filters: HistoryFilterParams = {}): UseThroughputHistoryQueryResult {
  const filterKey: Record<string, string> = {};
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useQuery({
    queryKey: adminKeys.throughputHistory(filterKey),
    queryFn: (): Promise<ThroughputHistoryResponse> => fetchHistory(filters),
    refetchInterval: 30_000,
  });
}

export function useThroughputComparisonQuery(filters: ComparisonFilterParams): UseThroughputComparisonQueryResult {
  const filterKey: Record<string, string> = { compareBy: filters.compareBy };
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useQuery({
    queryKey: adminKeys.throughputComparison(filterKey),
    queryFn: (): Promise<ThroughputComparisonResponse> => fetchComparison(filters),
    refetchInterval: 60_000,
  });
}
