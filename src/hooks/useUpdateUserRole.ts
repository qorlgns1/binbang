'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminUserInfo } from '@/types/admin';

import { adminKeys } from './queryKeys';

async function updateUserRole({ id, role }: { id: string; role: 'USER' | 'ADMIN' }): Promise<AdminUserInfo> {
  const res = await fetch(`/api/admin/users/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '역할 변경에 실패했습니다');
  }
  return res.json();
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
