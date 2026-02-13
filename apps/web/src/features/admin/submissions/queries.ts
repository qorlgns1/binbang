'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';

// ============================================================================
// Types
// ============================================================================

export interface SubmissionItem {
  id: string;
  responseId: string;
  status: string;
  rawPayload: unknown;
  formVersion: string | null;
  sourceIp: string | null;
  extractedFields: unknown;
  rejectionReason: string | null;
  consentBillingOnConditionMet: boolean | null;
  consentServiceScope: boolean | null;
  consentCapturedAt: string | null;
  consentTexts: { billing: string; scope: string } | null;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionsResponse {
  submissions: SubmissionItem[];
  nextCursor: string | null;
  total?: number;
}

interface SubmissionsFilterParams {
  status?: string;
}

export type UseSubmissionsQueryResult = UseQueryResult<SubmissionsResponse, Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchSubmissions(filters: SubmissionsFilterParams): Promise<SubmissionsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);

  const res = await fetch(`/api/admin/submissions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useSubmissionsQuery(filters: SubmissionsFilterParams = {}): UseSubmissionsQueryResult {
  const filterKey: Record<string, string> = {};
  if (filters.status) filterKey.status = filters.status;

  return useQuery({
    queryKey: adminKeys.submissions(filterKey),
    queryFn: (): Promise<SubmissionsResponse> => fetchSubmissions(filters),
  });
}
