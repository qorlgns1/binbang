/**
 * 관리자 - 패턴 관련 queries/mutations
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { PatternType, Platform } from '@workspace/db/enums';
import { adminKeys } from '@/lib/queryKeys';
import type {
  CreatePatternPayload,
  PlatformPatternItem,
  PlatformPatternsResponse,
  UpdatePatternPayload,
} from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

interface PatternFilters {
  platform?: Platform;
  patternType?: PatternType;
  includeInactive?: boolean;
}

interface PatternResponse {
  pattern: PlatformPatternItem;
}

interface DeleteResponse {
  success: boolean;
}

interface UpdatePatternVariables {
  id: string;
  payload: UpdatePatternPayload;
}

export type UsePatternsQueryResult = UseQueryResult<PlatformPatternsResponse, Error>;
export type UseCreatePatternMutationResult = UseMutationResult<PatternResponse, Error, CreatePatternPayload>;
export type UseUpdatePatternMutationResult = UseMutationResult<PatternResponse, Error, UpdatePatternVariables>;
export type UseDeletePatternMutationResult = UseMutationResult<DeleteResponse, Error, string>;

// ============================================================================
// Helper Functions
// ============================================================================

function filtersToRecord(filters: PatternFilters): Record<string, string> {
  const result: Record<string, string> = {};
  if (filters.platform) result.platform = filters.platform;
  if (filters.patternType) result.patternType = filters.patternType;
  if (filters.includeInactive) result.includeInactive = 'true';
  return result;
}

// ============================================================================
// Fetch/Mutation Functions
// ============================================================================

async function fetchPatterns(filters: PatternFilters): Promise<PlatformPatternsResponse> {
  const queryParams = new URLSearchParams();
  if (filters.platform) queryParams.set('platform', filters.platform);
  if (filters.patternType) queryParams.set('patternType', filters.patternType);
  if (filters.includeInactive) queryParams.set('includeInactive', 'true');

  const url = `/api/admin/patterns${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch patterns');
  return res.json();
}

async function createPattern(payload: CreatePatternPayload): Promise<PatternResponse> {
  const res = await fetch('/api/admin/patterns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create pattern');
  }
  return res.json();
}

async function updatePattern({ id, payload }: UpdatePatternVariables): Promise<PatternResponse> {
  const res = await fetch(`/api/admin/patterns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update pattern');
  }
  return res.json();
}

async function deletePattern(id: string): Promise<DeleteResponse> {
  const res = await fetch(`/api/admin/patterns/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete pattern');
  }
  return res.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function usePatternsQuery(filters: PatternFilters = {}): UsePatternsQueryResult {
  return useQuery({
    queryKey: adminKeys.patternList(filtersToRecord(filters)),
    queryFn: (): Promise<PlatformPatternsResponse> => fetchPatterns(filters),
  });
}

export function useCreatePatternMutation(): UseCreatePatternMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPattern,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.patterns() });
    },
  });
}

export function useUpdatePatternMutation(): UseUpdatePatternMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePattern,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.patterns() });
    },
  });
}

export function useDeletePatternMutation(): UseDeletePatternMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePattern,
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: adminKeys.patterns() });
    },
  });
}
