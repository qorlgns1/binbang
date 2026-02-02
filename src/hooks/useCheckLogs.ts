'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { accommodationKeys } from '@/hooks/queryKeys';
import type { CheckLogsPage } from '@/hooks/types';

async function fetchCheckLogs(accommodationId: string, cursor?: string): Promise<CheckLogsPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/accommodations/${accommodationId}/logs?${params}`);
  if (!res.ok) {
    throw new Error('체크 로그를 불러올 수 없습니다');
  }
  return res.json();
}

export function useCheckLogs(accommodationId: string) {
  return useInfiniteQuery({
    queryKey: accommodationKeys.logs(accommodationId),
    queryFn: ({ pageParam }) => fetchCheckLogs(accommodationId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!accommodationId,
  });
}
