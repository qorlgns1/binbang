/**
 * 관리자 - 시스템 설정 관련 mutations
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { SystemSettingsResponse, SystemSettingsUpdatePayload } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

export type UseUpdateSystemSettingsMutationResult = UseMutationResult<
  SystemSettingsResponse,
  Error,
  SystemSettingsUpdatePayload
>;

// ============================================================================
// Mutation Functions
// ============================================================================

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

// ============================================================================
// Hooks
// ============================================================================

export function useUpdateSystemSettingsMutation(): UseUpdateSystemSettingsMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(adminKeys.settings(), data);
      queryClient.invalidateQueries({ queryKey: adminKeys.settingsHistory() });
    },
  });
}
