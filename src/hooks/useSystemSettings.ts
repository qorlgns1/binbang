import { useQuery } from '@tanstack/react-query';

import type { SystemSettingsResponse } from '@/types/admin';

import { adminKeys } from './queryKeys';

async function fetchSettings(): Promise<SystemSettingsResponse> {
  const res = await fetch('/api/admin/settings');
  if (!res.ok) throw new Error('Failed to fetch system settings');
  return res.json();
}

export function useSystemSettings() {
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: fetchSettings,
  });
}
