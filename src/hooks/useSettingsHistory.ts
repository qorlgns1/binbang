import { useInfiniteQuery } from '@tanstack/react-query';

import type { SettingsChangeLogsResponse } from '@/types/admin';

import { adminKeys } from './queryKeys';

interface HistoryFilterParams {
  settingKey?: string;
  from?: string;
  to?: string;
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

export function useSettingsHistory(filters: HistoryFilterParams) {
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
