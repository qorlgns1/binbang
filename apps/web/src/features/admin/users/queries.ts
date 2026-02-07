/**
 * 관리자 - 사용자 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import {
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseQueryResult,
  useInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { ActivityType, UserActivityResponse } from '@/types/activity';
import type { AdminUserInfo, AdminUsersResponse } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

interface UsersFilterParams {
  search?: string;
  role?: string;
}

interface UserActivityFilters {
  type?: ActivityType | 'all';
}

export type UseUsersInfiniteQueryResult = UseInfiniteQueryResult<InfiniteData<AdminUsersResponse>, Error>;
export type UseUserDetailQueryResult = UseQueryResult<AdminUserInfo, Error>;
export type UseUserActivityInfiniteQueryResult = UseInfiniteQueryResult<InfiniteData<UserActivityResponse>, Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchUsers(filters: UsersFilterParams, cursor?: string): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.role) params.set('role', filters.role);
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/admin/users?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

async function fetchUserDetail(id: string): Promise<AdminUserInfo> {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) {
    throw new Error('사용자 정보를 불러올 수 없습니다');
  }
  return res.json();
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

// ============================================================================
// Hooks
// ============================================================================

export function useUsersInfiniteQuery(filters: UsersFilterParams): UseUsersInfiniteQueryResult {
  const filterKey: Record<string, string> = {};
  if (filters.search) filterKey.search = filters.search;
  if (filters.role) filterKey.role = filters.role;

  return useInfiniteQuery({
    queryKey: adminKeys.users(filterKey),
    queryFn: ({ pageParam }): Promise<AdminUsersResponse> => fetchUsers(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage): string | undefined => lastPage.nextCursor ?? undefined,
  });
}

export function useUserDetailQuery(id: string): UseUserDetailQueryResult {
  return useQuery({
    queryKey: adminKeys.userDetail(id),
    queryFn: (): Promise<AdminUserInfo> => fetchUserDetail(id),
    enabled: !!id,
  });
}

export function useUserActivityInfiniteQuery(
  userId: string,
  filters: UserActivityFilters = {},
): UseUserActivityInfiniteQueryResult {
  return useInfiniteQuery({
    queryKey: adminKeys.userActivity(userId, filters as Record<string, string>),
    queryFn: ({ pageParam }): Promise<UserActivityResponse> => fetchUserActivity({ userId, pageParam, filters }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage): string | null => lastPage.nextCursor,
    enabled: !!userId,
  });
}
