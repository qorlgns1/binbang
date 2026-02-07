/**
 * 하트비트 관련 queries
 * "use client" - TanStack Query hooks는 클라이언트 컴포넌트에서만 사용
 */
'use client';

import { type UseQueryResult, useQuery } from '@tanstack/react-query';

import { heartbeatKeys } from '@/lib/queryKeys';

// ============================================================================
// Types
// ============================================================================

export interface HeartbeatHistoryItem {
  id: number;
  timestamp: Date;
  status: 'healthy' | 'unhealthy' | 'processing';
  isProcessing: boolean;
  uptime?: number | null;
  workerId: string;
}

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

export type UseHeartbeatStatusQueryResult = UseQueryResult<HeartbeatStatus, Error>;
export type UseHeartbeatHistoryQueryResult = UseQueryResult<HeartbeatHistoryItem[], Error>;

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchHeartbeatStatus(): Promise<HeartbeatStatus> {
  const response = await fetch('/api/health/heartbeat');
  if (!response.ok) {
    throw new Error('Failed to fetch heartbeat status');
  }
  return response.json();
}

async function fetchHeartbeatHistory(): Promise<HeartbeatHistoryItem[]> {
  const response = await fetch('/api/heartbeat/history');
  if (!response.ok) {
    throw new Error('Failed to fetch heartbeat history');
  }
  return response.json();
}

// ============================================================================
// Hooks
// ============================================================================

export function useHeartbeatStatusQuery(): UseHeartbeatStatusQueryResult {
  return useQuery({
    queryKey: heartbeatKeys.status(),
    queryFn: fetchHeartbeatStatus,
    refetchInterval: 15000, // 15초마다 업데이트
    staleTime: 5000,
  });
}

export function useHeartbeatHistoryQuery(): UseHeartbeatHistoryQueryResult {
  return useQuery({
    queryKey: heartbeatKeys.history(),
    queryFn: fetchHeartbeatHistory,
    refetchInterval: 30000, // 30초마다 업데이트
    staleTime: 15000,
  });
}
