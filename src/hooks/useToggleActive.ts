'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accommodationKeys } from '@/hooks/queryKeys';
import type { Accommodation } from '@/types/accommodation';

async function toggleActive({ id, isActive }: { id: string; isActive: boolean }): Promise<Accommodation> {
  const res = await fetch(`/api/accommodations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    throw new Error('상태 변경에 실패했습니다');
  }
  return res.json();
}

export function useToggleActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleActive,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: accommodationKeys.lists() });
    },
  });
}
