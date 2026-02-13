'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';

export const FORM_QUESTION_FIELDS = [
  'CONTACT_CHANNEL',
  'CONTACT_VALUE',
  'TARGET_URL',
  'CONDITION_DEFINITION',
  'REQUEST_WINDOW',
  'CHECK_FREQUENCY',
  'BILLING_CONSENT',
  'SCOPE_CONSENT',
] as const;

export type FormQuestionField = (typeof FORM_QUESTION_FIELDS)[number];

export interface FormQuestionMappingItem {
  id: string;
  formKey: string;
  field: FormQuestionField;
  questionItemId: string | null;
  questionTitle: string;
  expectedAnswer: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormQuestionMappingsResponse {
  mappings: FormQuestionMappingItem[];
}

interface FormQuestionMappingFilters {
  formKey?: string;
  includeInactive?: boolean;
}

export type UseFormQuestionMappingsQueryResult = UseQueryResult<FormQuestionMappingsResponse, Error>;

function filtersToRecord(filters: FormQuestionMappingFilters): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.formKey) result.formKey = filters.formKey;
  if (filters.includeInactive) result.includeInactive = 'true';
  return result;
}

async function fetchFormQuestionMappings(filters: FormQuestionMappingFilters): Promise<FormQuestionMappingsResponse> {
  const params = new URLSearchParams();
  if (filters.formKey) params.set('formKey', filters.formKey);
  if (filters.includeInactive) params.set('includeInactive', 'true');

  const res = await fetch(`/api/admin/intake/mappings?${params.toString()}`);
  if (!res.ok) throw new Error('질문 매핑 목록을 불러오지 못했습니다');
  return res.json();
}

export function useFormQuestionMappingsQuery(
  filters: FormQuestionMappingFilters = {},
): UseFormQuestionMappingsQueryResult {
  return useQuery({
    queryKey: adminKeys.formQuestionMappingList(filtersToRecord(filters)),
    queryFn: (): Promise<FormQuestionMappingsResponse> => fetchFormQuestionMappings(filters),
  });
}
