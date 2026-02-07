import { useQuery } from '@tanstack/react-query';

import type { HeartbeatHistoryItem } from '@/lib/heartbeat/history';

import { heartbeatKeys } from './queryKeys';

export function useHeartbeatHistory() {
  return useQuery<HeartbeatHistoryItem[]>({
    queryKey: heartbeatKeys.history(),
    queryFn: async () => {
      const response = await fetch('/api/heartbeat/history');
      if (!response.ok) {
        throw new Error('Failed to fetch heartbeat history');
      }
      return response.json();
    },
    refetchInterval: 30000, // 30초마다 업데이트
    staleTime: 15000,
  });
}
