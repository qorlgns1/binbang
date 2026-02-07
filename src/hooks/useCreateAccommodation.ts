'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { accommodationKeys, userKeys } from '@/hooks/queryKeys';
import type { Accommodation, CreateAccommodationInput } from '@/types/accommodation';

export class QuotaExceededError extends Error {
  quota: { max: number; current: number };

  constructor(message: string, quota: { max: number; current: number }) {
    super(message);
    this.name = 'QuotaExceededError';
    this.quota = quota;
  }
}

async function createAccommodation(input: CreateAccommodationInput): Promise<Accommodation> {
  const res = await fetch('/api/accommodations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    if (err.error === 'quota_exceeded') {
      throw new QuotaExceededError(err.message, err.quota);
    }
    throw new Error(err.message || err.error || '숙소 추가에 실패했습니다');
  }
  return res.json();
}

export function useCreateAccommodation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccommodation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.quota() });
    },
  });
}
