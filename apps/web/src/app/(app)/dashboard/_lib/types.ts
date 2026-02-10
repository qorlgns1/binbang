import type { AvailabilityStatus } from '@workspace/db';

// ============================================================================
// Action Card Types
// ============================================================================

export type ActionCardType =
  | 'QUOTA_REACHED'
  | 'RECENT_ERROR_DETECTED'
  | 'NOTIFICATION_NOT_CONNECTED'
  | 'QUOTA_NEAR_LIMIT'
  | 'PAUSED_ACCOMMODATIONS_EXIST';

export type ActionCardColorScheme = 'critical' | 'warning' | 'info';

export type CtaAction = 'navigate_pricing' | 'navigate_kakao' | 'switch_tab_problem' | 'switch_tab_paused';

export interface ActionCard {
  type: ActionCardType;
  priority: number;
  title: string;
  description: string;
  ctaLabel: string;
  ctaAction: CtaAction;
  colorScheme: ActionCardColorScheme;
}

// ============================================================================
// Board Types
// ============================================================================

export type BoardTab = 'problem' | 'all' | 'paused';

// ============================================================================
// Dashboard Metrics (DF-002 ~ DF-010)
// ============================================================================

export interface DashboardMetrics {
  totalCount: number;
  activeCount: number;
  pausedCount: number;
  problemCount: number;
  availableCount: number;
  quotaRatio: number | null;
  quotaPercent: number | null;
  hasRecentError: boolean;
}

// ============================================================================
// Status Types
// ============================================================================

export type StatusType = AvailabilityStatus | 'PAUSED';
