import type { AvailabilityStatus, PatternType, Platform, SelectorCategory } from '@workspace/db/enums';

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

export interface QueueStatsInfo {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export type QueueJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'unknown';

export interface QueueJobSummary {
  id: string;
  name: string;
  state: QueueJobState;
  attemptsMade: number;
  attemptsMax: number;
  createdAt: string | null;
  processedAt: string | null;
  finishedAt: string | null;
  failedReason: string | null;
  dataPreview: {
    accommodationId?: string;
    cycleId?: string;
    caseId?: string;
    platform?: string;
    name?: string;
  };
}

export interface QueueSnapshotResponse {
  timestamp: string;
  queues: {
    cycle: QueueStatsInfo;
    check: QueueStatsInfo;
  };
  recentJobs: {
    cycle: QueueJobSummary[];
    check: QueueJobSummary[];
  };
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
  minValue: string | null;
  maxValue: string | null;
  updatedAt: string;
}

export interface SystemSettingsResponse {
  settings: SystemSettingItem[];
}

export interface SystemSettingsUpdatePayload {
  settings: { key: string; value: string; minValue?: string; maxValue?: string }[];
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

// ── Funnel ──

export type FunnelRangePreset = 'today' | '7d' | '30d' | 'all';

export interface AdminFunnelKpis {
  submitted: number;
  processed: number;
  paymentConfirmed: number;
  conditionMet: number;
}

export interface AdminFunnelConversion {
  submittedToProcessed: number;
  processedToPaymentConfirmed: number;
  paymentConfirmedToConditionMet: number;
  submittedToConditionMet: number;
}

export interface AdminFunnelSeriesItem extends AdminFunnelKpis {
  date: string;
}

export interface AdminFunnelResponse {
  range: {
    from: string;
    to: string;
    timezone: 'UTC';
  };
  filter: {
    from: string;
    to: string;
  };
  displayTimezone: 'Asia/Seoul';
  kpis: AdminFunnelKpis;
  conversion: AdminFunnelConversion;
  series: AdminFunnelSeriesItem[];
}

export interface AdminFunnelClickTotals {
  navSignup: number;
  navRequest: number;
  navPricing: number;
  mobileMenuOpen: number;
  mobileMenuCta: number;
  total: number;
}

export interface AdminFunnelClickSeriesItem extends AdminFunnelClickTotals {
  date: string;
}

export interface AdminFunnelClicksResponse {
  range: {
    from: string;
    to: string;
    timezone: 'UTC';
  };
  filter: {
    from: string;
    to: string;
  };
  displayTimezone: 'Asia/Seoul';
  totals: AdminFunnelClickTotals;
  submitted: number;
  navRequestToSubmitted: number;
  series: AdminFunnelClickSeriesItem[];
}

// ── Funnel Growth ──

export interface AdminFunnelGrowthKpis {
  organicVisit: number;
  availabilityCtaClick: number;
  signupCompleted: number;
  firstAlertCreated: number;
  totalAlertsCreated: number;
  alertsPerUser: number;
}

export interface AdminFunnelGrowthConversion {
  visitToSignup: number;
  signupToAlert: number;
  visitToAlert: number;
  ctaToSignup: number;
}

export interface AdminFunnelGrowthSeriesItem extends AdminFunnelGrowthKpis {
  date: string;
}

export interface AdminFunnelGrowthResponse {
  range: { from: string; to: string; timezone: 'UTC' };
  filter: { from: string; to: string };
  displayTimezone: 'Asia/Seoul';
  kpis: AdminFunnelGrowthKpis;
  conversion: AdminFunnelGrowthConversion;
  series: AdminFunnelGrowthSeriesItem[];
}

// ── Platform Selector Management ──

export interface PlatformSelectorItem {
  id: string;
  platform: Platform;
  category: SelectorCategory;
  name: string;
  selector: string;
  extractorCode: string | null;
  priority: number;
  isActive: boolean;
  description: string | null;
  createdBy: { id: string; name: string | null } | null;
  updatedBy: { id: string; name: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSelectorsResponse {
  selectors: PlatformSelectorItem[];
  total: number;
}

export interface CreateSelectorPayload {
  platform: Platform;
  category: SelectorCategory;
  name: string;
  selector: string;
  extractorCode?: string;
  priority?: number;
  description?: string;
}

export interface UpdateSelectorPayload {
  selector?: string;
  extractorCode?: string | null;
  priority?: number;
  isActive?: boolean;
  description?: string | null;
}

export interface PlatformPatternItem {
  id: string;
  platform: Platform;
  patternType: PatternType;
  pattern: string;
  locale: string;
  isActive: boolean;
  priority: number;
  createdBy: { id: string; name: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformPatternsResponse {
  patterns: PlatformPatternItem[];
  total: number;
}

export interface CreatePatternPayload {
  platform: Platform;
  patternType: PatternType;
  pattern: string;
  locale?: string;
  priority?: number;
}

export interface UpdatePatternPayload {
  pattern?: string;
  isActive?: boolean;
  priority?: number;
  locale?: string;
}

export interface SelectorChangeLogEntry {
  id: string;
  entityType: 'PlatformSelector' | 'PlatformPattern';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'toggle';
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  changedBy: { id: string; name: string | null };
  createdAt: string;
}

export interface SelectorChangeLogsResponse {
  logs: SelectorChangeLogEntry[];
  nextCursor: string | null;
}

export interface SelectorChangeLogsFilter {
  entityType?: 'PlatformSelector' | 'PlatformPattern';
  entityId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}
