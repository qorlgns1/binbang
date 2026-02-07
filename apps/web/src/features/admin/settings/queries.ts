/**
 * 관리자 - 시스템 설정 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { SettingsChangeLogsResponse, SystemSettingsResponse } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

interface HistoryFilterParams {
  settingKey?: string;
  from?: string;
  to?: string;
}

export type UseSystemSettingsQueryResult = UseQueryResult<SystemSettingsResponse, Error>;
export type UseSettingsHistoryInfiniteQueryResult = UseInfiniteQueryResult<
  InfiniteData<SettingsChangeLogsResponse>,
  Error
>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchSettings(): Promise<SystemSettingsResponse> {
  const res = await fetch('/api/admin/settings');
  if (!res.ok) throw new Error('Failed to fetch system settings');
  return res.json();
}

async function fetchSettingsHistory(
  filters: HistoryFilterParams,
  cursor?: string,
): Promise<SettingsChangeLogsResponse> {
  const params = new URLSearchParams();

  if (filters.settingKey) params.set('settingKey', filters.settingKey);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/admin/settings/history?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch settings history');
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useSystemSettingsQuery(): UseSystemSettingsQueryResult {
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: fetchSettings,
  });
}

export function useSettingsHistoryInfiniteQuery(filters: HistoryFilterParams): UseSettingsHistoryInfiniteQueryResult {
  const filterKey: Record<string, string> = {};
  if (filters.settingKey) filterKey.settingKey = filters.settingKey;
  if (filters.from) filterKey.from = filters.from;
  if (filters.to) filterKey.to = filters.to;

  return useInfiniteQuery({
    queryKey: adminKeys.settingsHistory(filterKey),
    queryFn: ({ pageParam }) => fetchSettingsHistory(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
