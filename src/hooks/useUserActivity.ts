'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import type { ActivityType, UserActivityResponse } from '@/types/activity';

import { adminKeys } from './queryKeys';

interface UserActivityFilters {
  type?: ActivityType | 'all';
}

async function fetchUserActivity({
  userId,
  pageParam,
  filters,
}: {
  userId: string;
  pageParam: string | null;
  filters: UserActivityFilters;
}): Promise<UserActivityResponse> {
  const params = new URLSearchParams();
  if (pageParam) params.set('cursor', pageParam);
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);

  const res = await fetch(`/api/admin/users/${userId}/activity?${params.toString()}`);
  if (!res.ok) {
    throw new Error('활동 이력을 불러올 수 없습니다');
  }
  return res.json();
}

export function useUserActivity(userId: string, filters: UserActivityFilters = {}) {
  return useInfiniteQuery({
    queryKey: adminKeys.userActivity(userId, filters as Record<string, string>),
    queryFn: ({ pageParam }) => fetchUserActivity({ userId, pageParam, filters }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
  });
}
