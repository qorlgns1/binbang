'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accommodationKeys } from '@/hooks/queryKeys';

async function deleteAccommodation(id: string): Promise<void> {
  const res = await fetch(`/api/accommodations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('숙소 삭제에 실패했습니다');
  }
}

export function useDeleteAccommodation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccommodation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.all });
    },
  });
}
