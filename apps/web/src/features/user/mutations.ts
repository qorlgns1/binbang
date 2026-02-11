/**
 * 사용자 관련 mutations
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseMutationResult, useMutation, useQueryClient } from '@tanstack/react-query';

import { userKeys } from '@/lib/queryKeys';

// ============================================================================
// Types
// ============================================================================

type TutorialAction = 'complete' | 'dismiss';

export type UseCompleteTutorialMutationResult = UseMutationResult<void, Error, void>;
export type UseDismissTutorialMutationResult = UseMutationResult<void, Error, void>;

// ============================================================================
// Mutation Functions
// ============================================================================

async function updateTutorialStatus(action: TutorialAction): Promise<void> {
  const res = await fetch('/api/user/tutorial', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    throw new Error('튜토리얼 상태 업데이트에 실패했습니다');
  }
}

// ============================================================================
// Hooks
// ============================================================================

export function useCompleteTutorialMutation(): UseCompleteTutorialMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<void> => updateTutorialStatus('complete'),
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: userKeys.tutorial() });
    },
  });
}

export function useDismissTutorialMutation(): UseDismissTutorialMutationResult {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (): Promise<void> => updateTutorialStatus('dismiss'),
    onSuccess: (): void => {
      queryClient.invalidateQueries({ queryKey: userKeys.tutorial() });
    },
  });
}
