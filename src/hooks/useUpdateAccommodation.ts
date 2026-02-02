'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accommodationKeys } from '@/hooks/queryKeys';
import type { Accommodation, UpdateAccommodationInput } from '@/hooks/types';

async function updateAccommodation({
  id,
  data,
}: {
  id: string;
  data: UpdateAccommodationInput;
}): Promise<Accommodation> {
  const res = await fetch(`/api/accommodations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '숙소 수정에 실패했습니다');
  }
  return res.json();
}

export function useUpdateAccommodation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccommodation,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: accommodationKeys.lists() });
    },
  });
}
