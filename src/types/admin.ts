import type { AvailabilityStatus, Platform } from '@/generated/prisma/client';

export interface WorkerHealthInfo {
  status: 'healthy' | 'degraded' | 'down';
  startedAt: string | null;
  lastHeartbeatAt: string | null;
  isProcessing: boolean;
  schedule: string | null;
}

export interface DbHealthInfo {
  connected: boolean;
  latencyMs: number;
}

export interface CheckRateInfo {
  total: number;
  success: number;
  error: number;
  rate: number;
}

export interface RecentErrorInfo {
  count: number;
  lastMessage: string | null;
}

export interface MonitoringSummary {
  worker: WorkerHealthInfo;
  db: DbHealthInfo;
  checkRate24h: CheckRateInfo;
  recentErrors1h: RecentErrorInfo;
  lastSuccessfulCheck: string | null;
  activeAccommodations: number;
}

export interface MonitoringLogEntry {
  id: string;
  createdAt: string;
  status: AvailabilityStatus;
  price: string | null;
  errorMessage: string | null;
  notificationSent: boolean;
  accommodation: {
    id: string;
    name: string;
    platform: Platform;
  };
}

export interface MonitoringLogsResponse {
  logs: MonitoringLogEntry[];
  nextCursor: string | null;
}

export interface MonitoringLogsFilter {
  status?: AvailabilityStatus;
  platform?: Platform;
  accommodationId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}
