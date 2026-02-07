/**
 * 워커 관련 mutations
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { heartbeatKeys } from '@/lib/queryKeys';

// ============================================================================
// Types
// ============================================================================

interface RestartWorkerResponse {
  success: boolean;
  message?: string;
}

export interface UseRestartWorkerMutationResult {
  restartWorker: () => Promise<RestartWorkerResponse>;
  isRestarting: boolean;
}

// ============================================================================
// Mutation Functions
// ============================================================================

async function restartWorkerFn(): Promise<RestartWorkerResponse> {
  const response = await fetch('/api/worker/restart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('워커 재시작 실패');
  }

  return response.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useRestartWorkerMutation(): UseRestartWorkerMutationResult {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: restartWorkerFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heartbeatKeys.status() });
    },
  });

  return {
    restartWorker: mutation.mutateAsync,
    isRestarting: mutation.isPending,
  };
}
