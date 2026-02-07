'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminUserInfo } from '@/types/admin';

import { adminKeys } from './queryKeys';

async function updateUserPlan({ id, planName }: { id: string; planName: string }): Promise<AdminUserInfo> {
  const res = await fetch(`/api/admin/users/${id}/plan`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '플랜 변경에 실패했습니다');
  }
  return res.json();
}

export function useUpdateUserPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
