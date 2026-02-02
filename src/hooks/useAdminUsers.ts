import { useInfiniteQuery } from '@tanstack/react-query';

import type { AdminUsersResponse } from '@/types/admin';

import { adminKeys } from './queryKeys';

interface UsersFilterParams {
  search?: string;
  role?: string;
}

async function fetchUsers(filters: UsersFilterParams, cursor?: string): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.role) params.set('role', filters.role);
  if (cursor) params.set('cursor', cursor);

  const res = await fetch(`/api/admin/users?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export function useAdminUsers(filters: UsersFilterParams) {
  const filterKey: Record<string, string> = {};
  if (filters.search) filterKey.search = filters.search;
  if (filters.role) filterKey.role = filters.role;

  return useInfiniteQuery({
    queryKey: adminKeys.users(filterKey),
    queryFn: ({ pageParam }) => fetchUsers(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
