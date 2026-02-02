'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { accommodationKeys } from '@/hooks/queryKeys';
import type { Accommodation } from '@/hooks/types';

async function fetchAccommodation(id: string): Promise<Accommodation> {
  const res = await fetch(`/api/accommodations/${id}`);
  if (!res.ok) {
    throw new Error('숙소 정보를 불러올 수 없습니다');
  }
  return res.json();
}

export function useAccommodation(id: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: accommodationKeys.detail(id),
    queryFn: () => fetchAccommodation(id),
    enabled: !!id,
    placeholderData: () => {
      const list = queryClient.getQueryData<Accommodation[]>(accommodationKeys.lists());
      return list?.find((a) => a.id === id);
    },
  });
}
