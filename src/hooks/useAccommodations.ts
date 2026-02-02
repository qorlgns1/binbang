'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { accommodationKeys } from '@/hooks/queryKeys';
import type { Accommodation } from '@/types/accommodation';

async function fetchAccommodations(): Promise<Accommodation[]> {
  const res = await fetch('/api/accommodations');
  if (!res.ok) {
    throw new Error('숙소 목록을 불러올 수 없습니다');
  }
  return res.json();
}

export function useAccommodations() {
  return useQuery({
    queryKey: accommodationKeys.lists(),
    queryFn: fetchAccommodations,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  });
}
