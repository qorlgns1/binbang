'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import { adminKeys } from '@/lib/queryKeys';

import type { FormQuestionField, FormQuestionMappingItem } from './queries';

export interface CreateFormQuestionMappingPayload {
  formKey?: string;
  field: FormQuestionField;
  questionItemId?: string | null;
  questionTitle: string;
  expectedAnswer?: string | null;
  isActive?: boolean;
}

export interface UpdateFormQuestionMappingPayload {
  formKey?: string;
  field?: FormQuestionField;
  questionItemId?: string | null;
  questionTitle?: string;
  expectedAnswer?: string | null;
  isActive?: boolean;
}

interface UpdateFormQuestionMappingVariables {
  id: string;
  payload: UpdateFormQuestionMappingPayload;
}

interface MappingResponse {
  mapping: FormQuestionMappingItem;
}

interface DeleteResponse {
  success: boolean;
}

export type UseCreateFormQuestionMappingMutationResult = UseMutationResult<
  MappingResponse,
  Error,
  CreateFormQuestionMappingPayload
>;
export type UseUpdateFormQuestionMappingMutationResult = UseMutationResult<
  MappingResponse,
  Error,
  UpdateFormQuestionMappingVariables
>;
export type UseDeleteFormQuestionMappingMutationResult = UseMutationResult<DeleteResponse, Error, string>;

async function createFormQuestionMapping(payload: CreateFormQuestionMappingPayload): Promise<MappingResponse> {
  const res = await fetch('/api/admin/intake/mappings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '질문 매핑 등록에 실패했습니다');
  }
  return res.json();
}

async function updateFormQuestionMapping({
  id,
  payload,
}: UpdateFormQuestionMappingVariables): Promise<MappingResponse> {
  const res = await fetch(`/api/admin/intake/mappings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '질문 매핑 수정에 실패했습니다');
  }
  return res.json();
}

async function deleteFormQuestionMapping(id: string): Promise<DeleteResponse> {
  const res = await fetch(`/api/admin/intake/mappings/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '질문 매핑 삭제에 실패했습니다');
  }
  return res.json();
}

export function useCreateFormQuestionMappingMutation(): UseCreateFormQuestionMappingMutationResult {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFormQuestionMapping,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.formQuestionMappings() });
    },
  });
}

export function useUpdateFormQuestionMappingMutation(): UseUpdateFormQuestionMappingMutationResult {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFormQuestionMapping,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.formQuestionMappings() });
    },
  });
}

export function useDeleteFormQuestionMappingMutation(): UseDeleteFormQuestionMappingMutationResult {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFormQuestionMapping,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.formQuestionMappings() });
    },
  });
}
