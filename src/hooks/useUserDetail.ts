'use client';

import { useQuery } from '@tanstack/react-query';

import type { AdminUserInfo } from '@/types/admin';

import { adminKeys } from './queryKeys';

async function fetchUserDetail(id: string): Promise<AdminUserInfo> {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) {
    throw new Error('사용자 정보를 불러올 수 없습니다');
  }
  return res.json();
}

export function useUserDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.userDetail(id),
    queryFn: () => fetchUserDetail(id),
    enabled: !!id,
  });
}
