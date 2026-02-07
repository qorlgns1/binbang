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

export interface AdminUserInfo {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: string[];
  planName: string | null;
  createdAt: string;
  _count: { accommodations: number };
}

export interface AdminUsersResponse {
  users: AdminUserInfo[];
  nextCursor: string | null;
  total?: number;
}

export interface SystemSettingItem {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
  updatedAt: string;
}

export interface SystemSettingsResponse {
  settings: SystemSettingItem[];
}

export interface SystemSettingsUpdatePayload {
  settings: { key: string; value: string }[];
}

export interface SettingsChangeLogEntry {
  id: string;
  settingKey: string;
  oldValue: string;
  newValue: string;
  changedBy: { id: string; name: string | null };
  createdAt: string;
}

export interface SettingsChangeLogsResponse {
  logs: SettingsChangeLogEntry[];
  nextCursor: string | null;
}

// ── Throughput ──

export interface ThroughputSummary {
  totalChecks: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgThroughputPerMin: number;
  lastCheckAt: string | null;
  lastCycle: {
    startedAt: string;
    durationMs: number;
    totalCount: number;
    successCount: number;
    errorCount: number;
    concurrency: number;
    browserPoolSize: number;
  } | null;
}

export interface ThroughputBucket {
  bucketStart: string;
  totalChecks: number;
  successCount: number;
  errorCount: number;
  throughputPerMin: number;
}

export interface ThroughputHistoryResponse {
  buckets: ThroughputBucket[];
  bucketMinutes: number;
}

export interface ThroughputComparisonGroup {
  key: string;
  value: number;
  avgThroughputPerMin: number;
  avgCycleDurationMs: number;
  avgSuccessRate: number;
  cycleCount: number;
}

export interface ThroughputComparisonResponse {
  compareBy: string;
  groups: ThroughputComparisonGroup[];
}
