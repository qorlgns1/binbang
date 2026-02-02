'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accommodationKeys } from '@/hooks/queryKeys';
import type { Accommodation, CreateAccommodationInput } from '@/types/accommodation';

async function createAccommodation(input: CreateAccommodationInput): Promise<Accommodation> {
  const res = await fetch('/api/accommodations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '숙소 추가에 실패했습니다');
  }
  return res.json();
}

export function useCreateAccommodation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccommodation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.lists() });
    },
  });
}
