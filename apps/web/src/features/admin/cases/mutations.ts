'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';
import type { CaseDetail, CaseMessageItem, PricingInputSnapshot } from './queries';

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

interface CreateCaseMessageVariables {
  caseId: string;
  templateKey: string;
  channel: string;
  content: string;
}

interface CreateCaseMessageResponse {
  message: CaseMessageItem;
}

interface SaveCasePriceQuoteVariables extends PricingInputSnapshot {
  caseId: string;
  changeReason: string;
}

interface SaveCasePriceQuoteResponse {
  ok: true;
  data: {
    quoteId: string;
    caseId: string;
    pricingPolicyVersion: 'v1';
    computedAmountKrw: number;
    roundedAmountKrw: number;
    changeReason: string;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
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
export type UseCreateCaseMessageMutationResult = UseMutationResult<
  CreateCaseMessageResponse,
  Error,
  CreateCaseMessageVariables
>;
export type UseSaveCasePriceQuoteMutationResult = UseMutationResult<
  SaveCasePriceQuoteResponse,
  Error,
  SaveCasePriceQuoteVariables
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

async function createCaseMessage({
  caseId,
  templateKey,
  channel,
  content,
}: CreateCaseMessageVariables): Promise<CreateCaseMessageResponse> {
  const res = await fetch(`/api/admin/cases/${caseId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ templateKey, channel, content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '메시지 기록에 실패했습니다');
  }
  return res.json();
}

async function saveCasePriceQuote({
  caseId,
  platform,
  durationBucket,
  difficulty,
  urgencyBucket,
  frequencyBucket,
  changeReason,
}: SaveCasePriceQuoteVariables): Promise<SaveCasePriceQuoteResponse> {
  const res = await fetch(`/api/admin/cases/${caseId}/pricing/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform,
      durationBucket,
      difficulty,
      urgencyBucket,
      frequencyBucket,
      changeReason,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    const message = err?.error?.message || err?.error || '견적 저장에 실패했습니다';
    throw new Error(message);
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

export function useConfirmPaymentMutation(): UseConfirmPaymentMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmPayment,
    onSuccess: (_data, variables): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
      queryClient.invalidateQueries({ queryKey: adminKeys.caseDetail(variables.caseId) });
    },
  });
}

export function useLinkAccommodationMutation(): UseLinkAccommodationMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkAccommodation,
    onSuccess: (_data, variables): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
      queryClient.invalidateQueries({ queryKey: adminKeys.caseDetail(variables.caseId) });
    },
  });
}

export function useCreateCaseMessageMutation(): UseCreateCaseMessageMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCaseMessage,
    onSuccess: (_data, variables): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.caseDetail(variables.caseId) });
    },
  });
}

export function useSaveCasePriceQuoteMutation(): UseSaveCasePriceQuoteMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveCasePriceQuote,
    onSuccess: (_data, variables): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.caseDetail(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.casePricingQuotes(variables.caseId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.cases() });
    },
  });
}
