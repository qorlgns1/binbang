'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SystemSettingsResponse, SystemSettingsUpdatePayload } from '@/types/admin';

import { adminKeys } from './queryKeys';

async function updateSettings(payload: SystemSettingsUpdatePayload): Promise<SystemSettingsResponse> {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '설정 저장에 실패했습니다');
  }
  return res.json();
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(adminKeys.settings(), data);
      queryClient.invalidateQueries({ queryKey: adminKeys.settingsHistory() });
    },
  });
}
