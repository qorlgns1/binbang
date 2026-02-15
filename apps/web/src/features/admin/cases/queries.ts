'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';

// ============================================================================
// Types
// ============================================================================

interface AmbiguityResult {
  severity: 'GREEN' | 'AMBER' | 'RED';
  missingSlots: string[];
  ambiguousTerms: string[];
}

export interface CaseItem {
  id: string;
  submissionId: string;
  status: string;
  assignedTo: string | null;
  statusChangedAt: string;
  statusChangedBy: string | null;
  note: string | null;
  ambiguityResult: AmbiguityResult | null;
  clarificationResolvedAt: string | null;
  paymentConfirmedAt: string | null;
  paymentConfirmedBy: string | null;
  accommodationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionMetEvent {
  id: string;
  checkLogId: string;
  evidenceSnapshot: unknown;
  screenshotBase64: string | null;
  capturedAt: string;
  createdAt: string;
}

export interface CaseMessageItem {
  id: string;
  templateKey: string;
  channel: string;
  content: string;
  sentById: string;
  createdAt: string;
}

export interface PricingInputSnapshot {
  platform: 'AIRBNB' | 'AGODA' | 'OTHER';
  durationBucket: 'LE_24H' | 'BETWEEN_24H_72H' | 'BETWEEN_72H_7D' | 'GT_7D';
  difficulty: 'L' | 'M' | 'H';
  urgencyBucket: 'D0_D1' | 'D2_D3' | 'D4_PLUS';
  frequencyBucket: 'F15M' | 'F30M' | 'F60M_PLUS';
}

interface PricingWeightSnapshot {
  baseFee: number;
  duration: number;
  difficulty: number;
  urgency: number;
  frequency: number;
}

export interface CasePricePreview {
  caseId: string;
  pricingPolicyVersion: 'v1';
  inputsSnapshot: PricingInputSnapshot;
  weightsSnapshot: PricingWeightSnapshot;
  computedAmountKrw: number;
  roundedAmountKrw: number;
}

export interface CasePriceQuoteHistoryItem extends CasePricePreview {
  quoteId: string;
  changeReason: string;
  isActive: boolean;
  changedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseDetail extends CaseItem {
  submission: {
    id: string;
    responseId: string;
    status: string;
    rawPayload: unknown;
    extractedFields: unknown;
    rejectionReason: string | null;
    consentBillingOnConditionMet: boolean | null;
    consentServiceScope: boolean | null;
    consentCapturedAt: string | null;
    consentTexts: { billing: string; scope: string } | null;
    receivedAt: string;
  };
  statusLogs: {
    id: string;
    fromStatus: string;
    toStatus: string;
    changedById: string;
    reason: string | null;
    createdAt: string;
  }[];
  conditionMetEvents: ConditionMetEvent[];
  messages: CaseMessageItem[];
}

export interface CasesResponse {
  cases: CaseItem[];
  nextCursor: string | null;
  total?: number;
}

interface CasesFilterParams {
  status?: string;
}

export type UseCasesQueryResult = UseQueryResult<CasesResponse, Error>;
export type UseCaseDetailQueryResult = UseQueryResult<CaseDetail, Error>;
export type UseCasePricePreviewQueryResult = UseQueryResult<CasePricePreview, Error>;
export type UseCasePriceQuoteHistoryQueryResult = UseQueryResult<CasePriceQuoteHistoryItem[], Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchCases(filters: CasesFilterParams): Promise<CasesResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);

  const res = await fetch(`/api/admin/cases?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch cases');
  return res.json();
}

async function fetchCaseDetail(id: string): Promise<CaseDetail> {
  const res = await fetch(`/api/admin/cases/${id}`);
  if (!res.ok) throw new Error('케이스 정보를 불러올 수 없습니다');
  const data = await res.json();
  return data.case;
}

async function fetchCasePricePreview(caseId: string, input: PricingInputSnapshot): Promise<CasePricePreview> {
  const res = await fetch(`/api/admin/cases/${caseId}/pricing/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = await res.json();
    const message = err?.error?.message || '견적 미리보기에 실패했습니다';
    throw new Error(message);
  }

  const data = await res.json();
  return data.data;
}

async function fetchCasePriceQuotes(caseId: string): Promise<CasePriceQuoteHistoryItem[]> {
  const res = await fetch(`/api/admin/cases/${caseId}/pricing/quotes`);
  if (!res.ok) {
    const err = await res.json();
    const message = err?.error?.message || '견적 이력을 불러오지 못했습니다';
    throw new Error(message);
  }
  const data = await res.json();
  return data.data.quotes;
}

// ============================================================================
// Hooks
// ============================================================================

export function useCasesQuery(filters: CasesFilterParams = {}): UseCasesQueryResult {
  const filterKey: Record<string, string> = {};
  if (filters.status) filterKey.status = filters.status;

  return useQuery({
    queryKey: adminKeys.cases(filterKey),
    queryFn: (): Promise<CasesResponse> => fetchCases(filters),
  });
}

export function useCaseDetailQuery(id: string): UseCaseDetailQueryResult {
  return useQuery({
    queryKey: adminKeys.caseDetail(id),
    queryFn: (): Promise<CaseDetail> => fetchCaseDetail(id),
    enabled: !!id,
  });
}

export function useCasePricePreviewQuery(
  caseId: string,
  input: PricingInputSnapshot | null,
): UseCasePricePreviewQueryResult {
  const previewKey: Record<string, string> =
    input === null
      ? {}
      : {
          platform: input.platform,
          durationBucket: input.durationBucket,
          difficulty: input.difficulty,
          urgencyBucket: input.urgencyBucket,
          frequencyBucket: input.frequencyBucket,
        };

  return useQuery({
    queryKey: adminKeys.casePricingPreview(caseId, previewKey),
    queryFn: (): Promise<CasePricePreview> => fetchCasePricePreview(caseId, input as PricingInputSnapshot),
    enabled: !!caseId && !!input,
  });
}

export function useCasePriceQuoteHistoryQuery(caseId: string): UseCasePriceQuoteHistoryQueryResult {
  return useQuery({
    queryKey: adminKeys.casePricingQuotes(caseId),
    queryFn: (): Promise<CasePriceQuoteHistoryItem[]> => fetchCasePriceQuotes(caseId),
    enabled: !!caseId,
  });
}
