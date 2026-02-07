/**
 * 관리자 - 플랜 관련 mutations
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';

import type { AdminPlanInfo } from './queries';

// ============================================================================
// Types
// ============================================================================

export interface PlanInput {
  name: string;
  description?: string | null;
  price: number;
  interval?: string;
  maxAccommodations: number;
  checkIntervalMin: number;
}

interface UpdatePlanVariables extends Partial<PlanInput> {
  id: string;
}

export type UseCreatePlanMutationResult = UseMutationResult<AdminPlanInfo, Error, PlanInput>;
export type UseUpdatePlanMutationResult = UseMutationResult<AdminPlanInfo, Error, UpdatePlanVariables>;
export type UseDeletePlanMutationResult = UseMutationResult<void, Error, string>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function createPlan(input: PlanInput): Promise<AdminPlanInfo> {
  const res = await fetch('/api/admin/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '플랜 생성에 실패했습니다');
  }
  return res.json();
}

async function updatePlan({ id, ...input }: UpdatePlanVariables): Promise<AdminPlanInfo> {
  const res = await fetch(`/api/admin/plans/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '플랜 수정에 실패했습니다');
  }
  return res.json();
}

async function deletePlan(id: string): Promise<void> {
  const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '플랜 삭제에 실패했습니다');
  }
}

// ============================================================================
// Hooks
// ============================================================================

export function useCreatePlanMutation(): UseCreatePlanMutationResult {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}

export function useUpdatePlanMutation(): UseUpdatePlanMutationResult {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}

export function useDeletePlanMutation(): UseDeletePlanMutationResult {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}
