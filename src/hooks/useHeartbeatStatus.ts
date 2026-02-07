import { useQuery } from '@tanstack/react-query';

import { heartbeatKeys } from './queryKeys';

export interface HeartbeatStatus {
  status: 'healthy' | 'unhealthy' | 'error';
  timestamp: string;
  isHealthy: boolean;
  workerStatus: string;
  lastHeartbeat: string | null;
  minutesSinceLastHeartbeat: number;
  isProcessing: boolean;
  processingDuration: number;
  alerts: string[] | null;
}

export function useHeartbeatStatus() {
  return useQuery<HeartbeatStatus>({
    queryKey: heartbeatKeys.status(),
    queryFn: async () => {
      const response = await fetch('/api/health/heartbeat');
      if (!response.ok) {
        throw new Error('Failed to fetch heartbeat status');
      }
      return response.json();
    },
    refetchInterval: 15000, // 15초마다 업데이트
    staleTime: 5000,
  });
}
