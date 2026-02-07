/**
 * 관리자 - 사용자 관련 mutations
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { AdminUserInfo } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

interface UpdateUserRolesVariables {
  id: string;
  roles: string[];
}

interface UpdateUserPlanVariables {
  id: string;
  planName: string;
}

export type UseUpdateUserRoleMutationResult = UseMutationResult<AdminUserInfo, Error, UpdateUserRolesVariables>;
export type UseUpdateUserPlanMutationResult = UseMutationResult<AdminUserInfo, Error, UpdateUserPlanVariables>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function updateUserRoles({ id, roles }: UpdateUserRolesVariables): Promise<AdminUserInfo> {
  const res = await fetch(`/api/admin/users/${id}/roles`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roles }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '역할 변경에 실패했습니다');
  }
  return res.json();
}

async function updateUserPlan({ id, planName }: UpdateUserPlanVariables): Promise<AdminUserInfo> {
  const res = await fetch(`/api/admin/users/${id}/plan`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planName }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '플랜 변경에 실패했습니다');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useUpdateUserRoleMutation(): UseUpdateUserRoleMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserRoles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useUpdateUserPlanMutation(): UseUpdateUserPlanMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
