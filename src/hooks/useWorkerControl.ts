import { useMutation, useQueryClient } from '@tanstack/react-query';

import { heartbeatKeys } from './queryKeys';

export function useWorkerControl() {
  const queryClient = useQueryClient();

  const restartWorker = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/worker/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('워커 재시작 실패');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: heartbeatKeys.status() });
    },
  });

  return {
    restartWorker: restartWorker.mutateAsync,
    isRestarting: restartWorker.isPending,
  };
}
