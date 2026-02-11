'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { CaseDetail } from './queries';

// ============================================================================
// Types
// ============================================================================

interface CreateCaseVariables {
  submissionId: string;
}

interface TransitionCaseStatusVariables {
  caseId: string;
  status: string;
  reason?: string;
}

interface CreateCaseResponse {
  case: CaseDetail;
}

interface TransitionCaseStatusResponse {
  case: CaseDetail;
}

export type UseCreateCaseMutationResult = UseMutationResult<CreateCaseResponse, Error, CreateCaseVariables>;
export type UseTransitionCaseStatusMutationResult = UseMutationResult<
  TransitionCaseStatusResponse,
  Error,
  TransitionCaseStatusVariables
>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function createCase({ submissionId }: CreateCaseVariables): Promise<CreateCaseResponse> {
  const res = await fetch('/api/admin/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '케이스 생성에 실패했습니다');
  }
  return res.json();
}

async function transitionCaseStatus({
  caseId,
  status,
  reason,
}: TransitionCaseStatusVariables): Promise<TransitionCaseStatusResponse> {
  const res = await fetch(`/api/admin/cases/${caseId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '상태 변경에 실패했습니다');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useCreateCaseMutation(): UseCreateCaseMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCase,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
    },
  });
}

export function useTransitionCaseStatusMutation(): UseTransitionCaseStatusMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transitionCaseStatus,
    onSuccess: (_data, variables): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
      queryClient.invalidateQueries({ queryKey: adminKeys.caseDetail(variables.caseId) });
    },
  });
}
