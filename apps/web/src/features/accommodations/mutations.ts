/**
 * 숙소 관련 mutations
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import { accommodationKeys, userKeys } from '@/lib/queryKeys';
import type { Accommodation, CreateAccommodationInput, UpdateAccommodationInput } from '@/types/accommodation';

// ============================================================================
// Types
// ============================================================================

export class QuotaExceededError extends Error {
  quota: { max: number; current: number };

  constructor(message: string, quota: { max: number; current: number }) {
    super(message);
    this.name = 'QuotaExceededError';
    this.quota = quota;
  }
}

interface UpdateAccommodationVariables {
  id: string;
  data: UpdateAccommodationInput;
}

interface ToggleActiveVariables {
  id: string;
  isActive: boolean;
}

export type UseCreateAccommodationMutationResult = UseMutationResult<Accommodation, Error, CreateAccommodationInput>;
export type UseUpdateAccommodationMutationResult = UseMutationResult<
  Accommodation,
  Error,
  UpdateAccommodationVariables
>;
export type UseDeleteAccommodationMutationResult = UseMutationResult<void, Error, string>;
export type UseToggleActiveMutationResult = UseMutationResult<Accommodation, Error, ToggleActiveVariables>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function createAccommodation(input: CreateAccommodationInput): Promise<Accommodation> {
  const res = await fetch('/api/accommodations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    if (err.error === 'quota_exceeded') {
      throw new QuotaExceededError(err.message, err.quota);
    }
    throw new Error(err.message || err.error || '숙소 추가에 실패했습니다');
  }
  return res.json();
}

async function updateAccommodation({ id, data }: UpdateAccommodationVariables): Promise<Accommodation> {
  const res = await fetch(`/api/accommodations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '숙소 수정에 실패했습니다');
  }
  return res.json();
}

async function deleteAccommodation(id: string): Promise<void> {
  const res = await fetch(`/api/accommodations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('숙소 삭제에 실패했습니다');
  }
}

async function toggleActive({ id, isActive }: ToggleActiveVariables): Promise<Accommodation> {
  const res = await fetch(`/api/accommodations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    throw new Error('상태 변경에 실패했습니다');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useCreateAccommodationMutation(): UseCreateAccommodationMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccommodation,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.quota() });
    },
  });
}

export function useUpdateAccommodationMutation(): UseUpdateAccommodationMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccommodation,
    onSuccess: (_data: Accommodation, variables: UpdateAccommodationVariables): void => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: accommodationKeys.lists() });
    },
  });
}

export function useDeleteAccommodationMutation(): UseDeleteAccommodationMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccommodation,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.all });
    },
  });
}

export function useToggleActiveMutation(): UseToggleActiveMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleActive,
    onSuccess: (_data: Accommodation, variables: ToggleActiveVariables): void => {
      queryClient.invalidateQueries({ queryKey: accommodationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: accommodationKeys.lists() });
    },
  });
}
