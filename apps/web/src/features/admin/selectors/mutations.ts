/**
 * 관리자 - 셀렉터 관련 mutations
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import type { Platform } from '@/generated/prisma/client';
import { adminKeys } from '@/lib/queryKeys';
import type { CreateSelectorPayload, PlatformSelectorItem, UpdateSelectorPayload } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

interface SelectorResponse {
  selector: PlatformSelectorItem;
}

interface DeleteResponse {
  success: boolean;
}

interface UpdateSelectorVariables {
  id: string;
  payload: UpdateSelectorPayload;
}

interface InvalidateCacheResult {
  success: boolean;
  invalidatedPlatforms: Platform[];
  workerCacheInvalidated: boolean;
  workerResult?: {
    success: boolean;
    invalidated: Platform[];
    reloaded: Platform[];
  };
}

export type UseCreateSelectorMutationResult = UseMutationResult<SelectorResponse, Error, CreateSelectorPayload>;
export type UseUpdateSelectorMutationResult = UseMutationResult<SelectorResponse, Error, UpdateSelectorVariables>;
export type UseDeleteSelectorMutationResult = UseMutationResult<DeleteResponse, Error, string>;
export type UseInvalidateSelectorCacheMutationResult = UseMutationResult<
  InvalidateCacheResult,
  Error,
  Platform | undefined
>;
export type UseUpdateTestableAttributesMutationResult = UseMutationResult<string[], Error, string[]>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function createSelector(payload: CreateSelectorPayload): Promise<SelectorResponse> {
  const res = await fetch('/api/admin/selectors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create selector');
  }
  return res.json();
}

async function updateSelector({ id, payload }: UpdateSelectorVariables): Promise<SelectorResponse> {
  const res = await fetch(`/api/admin/selectors/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update selector');
  }
  return res.json();
}

async function deleteSelector(id: string): Promise<DeleteResponse> {
  const res = await fetch(`/api/admin/selectors/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete selector');
  }
  return res.json();
}

async function invalidateCache(platform?: Platform): Promise<InvalidateCacheResult> {
  const res = await fetch('/api/admin/selectors/cache', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to invalidate cache');
  }
  return res.json();
}

async function updateTestableAttributes(attributes: string[]): Promise<string[]> {
  const res = await fetch('/api/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: [{ key: 'selectorTest.testableAttributes', value: JSON.stringify(attributes) }],
    }),
  });

  if (!res.ok) throw new Error('Failed to update settings');
  return attributes;
}

// ============================================================================
// Hooks
// ============================================================================

export function useCreateSelectorMutation(): UseCreateSelectorMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSelector,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.selectors() });
    },
  });
}

export function useUpdateSelectorMutation(): UseUpdateSelectorMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSelector,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.selectors() });
    },
  });
}

export function useDeleteSelectorMutation(): UseDeleteSelectorMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSelector,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.selectors() });
    },
  });
}

export function useInvalidateSelectorCacheMutation(): UseInvalidateSelectorCacheMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: invalidateCache,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.selectors() });
    },
  });
}

export function useUpdateTestableAttributesMutation(): UseUpdateTestableAttributesMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTestableAttributes,
    onSuccess: (data: string[]): void => {
      queryClient.setQueryData(adminKeys.testableAttributes(), data);
    },
  });
}
