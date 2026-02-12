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

interface ConfirmPaymentVariables {
  caseId: string;
  note?: string;
}

interface LinkAccommodationVariables {
  caseId: string;
  accommodationId: string;
}

interface CreateCaseResponse {
  case: CaseDetail;
}

interface TransitionCaseStatusResponse {
  case: CaseDetail;
}

interface ConfirmPaymentResponse {
  case: CaseDetail;
}

interface LinkAccommodationResponse {
  case: CaseDetail;
}

export type UseCreateCaseMutationResult = UseMutationResult<CreateCaseResponse, Error, CreateCaseVariables>;
export type UseTransitionCaseStatusMutationResult = UseMutationResult<
  TransitionCaseStatusResponse,
  Error,
  TransitionCaseStatusVariables
>;
export type UseConfirmPaymentMutationResult = UseMutationResult<ConfirmPaymentResponse, Error, ConfirmPaymentVariables>;
export type UseLinkAccommodationMutationResult = UseMutationResult<
  LinkAccommodationResponse,
  Error,
  LinkAccommodationVariables
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

async function confirmPayment({ caseId, note }: ConfirmPaymentVariables): Promise<ConfirmPaymentResponse> {
  const res = await fetch(`/api/admin/cases/${caseId}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '결제 확인에 실패했습니다');
  }
  return res.json();
}

async function linkAccommodation({
  caseId,
  accommodationId,
}: LinkAccommodationVariables): Promise<LinkAccommodationResponse> {
  const res = await fetch(`/api/admin/cases/${caseId}/accommodation`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accommodationId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '숙소 연결에 실패했습니다');
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
    onSuccess: async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
    },
  });
}

export function useTransitionCaseStatusMutation(): UseTransitionCaseStatusMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transitionCaseStatus,
    onSuccess: async (_data, variables): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.caseDetail(variables.caseId) });
    },
  });
}

export function useConfirmPaymentMutation(): UseConfirmPaymentMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmPayment,
    onSuccess: async (_data, variables): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.caseDetail(variables.caseId) });
    },
  });
}

export function useLinkAccommodationMutation(): UseLinkAccommodationMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkAccommodation,
    onSuccess: async (_data, variables): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
      await queryClient.invalidateQueries({ queryKey: adminKeys.caseDetail(variables.caseId) });
    },
  });
}
