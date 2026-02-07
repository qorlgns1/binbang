/**
 * 관리자 - 셀렉터 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { useState } from 'react';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import type { Platform, SelectorCategory } from '@/generated/prisma/client';
import { adminKeys } from '@/lib/queryKeys';
import type { PlatformSelectorsResponse, SelectorChangeLogsFilter, SelectorChangeLogsResponse } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

interface SelectorFilters {
  platform?: Platform;
  category?: SelectorCategory;
  includeInactive?: boolean;
}

export interface TestableElement {
  attribute: string;
  value: string;
  tagName: string;
  text: string;
  html: string;
}

export interface SelectorTestResult {
  success: boolean;
  platform: Platform;
  url: string;
  result?: {
    available: boolean;
    price: string | null;
    reason: string | null;
    metadata?: Record<string, unknown>;
  };
  matchedSelectors?: {
    category: string;
    name: string;
    matched: boolean;
  }[];
  matchedPatterns?: {
    type: string;
    pattern: string;
    matched: boolean;
  }[];
  testableElements?: TestableElement[];
  error?: string;
  durationMs: number;
}

export interface SelectorTestInput {
  url: string;
  checkIn: string;
  checkOut: string;
  adults: number;
}

export type UseSelectorsQueryResult = UseQueryResult<PlatformSelectorsResponse, Error>;
export type UseSelectorHistoryQueryResult = UseQueryResult<SelectorChangeLogsResponse, Error>;
export type UseTestableAttributesQueryResult = UseQueryResult<string[], Error>;

export interface UseSelectorTestQueryResult {
  runTest: () => void;
  data: SelectorTestResult | undefined;
  isPending: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function selectorFiltersToRecord(filters: SelectorFilters): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.platform) result.platform = filters.platform;
  if (filters.category) result.category = filters.category;
  if (filters.includeInactive) result.includeInactive = 'true';
  return result;
}

function historyFiltersToRecord(filters: SelectorChangeLogsFilter): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.entityType) result.entityType = filters.entityType;
  if (filters.entityId) result.entityId = filters.entityId;
  if (filters.from) result.from = filters.from;
  if (filters.to) result.to = filters.to;
  if (filters.cursor) result.cursor = filters.cursor;
  if (filters.limit) result.limit = String(filters.limit);
  return result;
}

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchSelectors(filters: SelectorFilters): Promise<PlatformSelectorsResponse> {
  const queryParams = new URLSearchParams();
  if (filters.platform) queryParams.set('platform', filters.platform);
  if (filters.category) queryParams.set('category', filters.category);
  if (filters.includeInactive) queryParams.set('includeInactive', 'true');

  const url = `/api/admin/selectors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch selectors');
  return res.json();
}

async function fetchSelectorHistory(filters: SelectorChangeLogsFilter): Promise<SelectorChangeLogsResponse> {
  const queryParams = new URLSearchParams();
  if (filters.entityType) queryParams.set('entityType', filters.entityType);
  if (filters.entityId) queryParams.set('entityId', filters.entityId);
  if (filters.from) queryParams.set('from', filters.from);
  if (filters.to) queryParams.set('to', filters.to);
  if (filters.cursor) queryParams.set('cursor', filters.cursor);
  if (filters.limit) queryParams.set('limit', String(filters.limit));

  const url = `/api/admin/selectors/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch selector history');
  return res.json();
}

async function runSelectorTest(input: SelectorTestInput): Promise<SelectorTestResult> {
  const res = await fetch('/api/admin/selectors/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Test failed: ${res.status}`);
  }

  return res.json();
}

const SETTING_KEY = 'selectorTest.testableAttributes';

async function fetchTestableAttributes(): Promise<string[]> {
  const res = await fetch('/api/admin/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');

  const data = await res.json();
  const setting = data.settings.find((s: { key: string }) => s.key === SETTING_KEY);

  if (!setting) return ['data-testid', 'data-test-id', 'data-selenium', 'data-element-name'];

  try {
    return JSON.parse(setting.value);
  } catch {
    return [];
  }
}

// ============================================================================
// Hooks
// ============================================================================

export function useSelectorsQuery(filters: SelectorFilters = {}): UseSelectorsQueryResult {
  return useQuery({
    queryKey: adminKeys.selectorList(selectorFiltersToRecord(filters)),
    queryFn: () => fetchSelectors(filters),
  });
}

export function useSelectorHistoryQuery(filters: SelectorChangeLogsFilter = {}): UseSelectorHistoryQueryResult {
  return useQuery({
    queryKey: adminKeys.selectorHistory(historyFiltersToRecord(filters)),
    queryFn: () => fetchSelectorHistory(filters),
  });
}

export function useSelectorTestQuery(input: SelectorTestInput | null): UseSelectorTestQueryResult {
  // 버튼 클릭 시 제출된 input (queryKey로 사용)
  const [submittedInput, setSubmittedInput] = useState<SelectorTestInput | null>(null);

  const query = useQuery<SelectorTestResult>({
    queryKey: adminKeys.selectorTestResult(submittedInput),
    queryFn: () => runSelectorTest(submittedInput as SelectorTestInput),
    enabled: !!submittedInput,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const runTest = (): void => {
    if (input) {
      setSubmittedInput({ ...input }); // 새 객체로 복사해서 항상 새 쿼리 트리거
    }
  };

  return {
    runTest,
    data: query.data,
    isPending: query.isFetching,
  };
}

export function useTestableAttributesQuery(): UseTestableAttributesQueryResult {
  return useQuery({
    queryKey: adminKeys.testableAttributes(),
    queryFn: fetchTestableAttributes,
    staleTime: 5 * 60 * 1000,
  });
}
