import { ACTION_CARDS_MAX, ACTION_CARD_CONFIG, ACTION_CARD_PRIORITY } from './constants';
import type { ActionCard, ActionCardType, DashboardMetrics } from './types';

/**
 * Action 카드 생성 (FR-020 ~ FR-027)
 *
 * 조건 충족 시 candidate 추가 → QUOTA_REACHED/QUOTA_NEAR_LIMIT 중복 금지(FR-023)
 * → 우선순위 내림차순 정렬(FR-026) → 최대 3개(FR-022) 반환
 */
export function generateActionCards(metrics: DashboardMetrics, hasKakaoToken: boolean): ActionCard[] {
  const candidates: ActionCard[] = [];
  let hasQuotaReached = false;

  // QUOTA_REACHED (priority=100)
  if (metrics.quotaRatio !== null && metrics.quotaRatio >= 1.0) {
    candidates.push(buildCard('QUOTA_REACHED'));
    hasQuotaReached = true;
  }

  // RECENT_ERROR_DETECTED (priority=90)
  if (metrics.hasRecentError) {
    candidates.push(buildCard('RECENT_ERROR_DETECTED'));
  }

  // NOTIFICATION_NOT_CONNECTED (priority=80)
  if (!hasKakaoToken) {
    candidates.push(buildCard('NOTIFICATION_NOT_CONNECTED'));
  }

  // QUOTA_NEAR_LIMIT (priority=70) - FR-023: QUOTA_REACHED 시 생성 금지
  if (!hasQuotaReached && metrics.quotaRatio !== null && metrics.quotaRatio >= 0.8 && metrics.quotaRatio < 1.0) {
    candidates.push(buildCard('QUOTA_NEAR_LIMIT'));
  }

  // PAUSED_ACCOMMODATIONS_EXIST (priority=60)
  if (metrics.pausedCount > 0) {
    candidates.push(buildCard('PAUSED_ACCOMMODATIONS_EXIST'));
  }

  // FR-026: 우선순위 내림차순 정렬
  candidates.sort((a, b): number => b.priority - a.priority);

  // FR-022: 최대 3개
  return candidates.slice(0, ACTION_CARDS_MAX);
}

function buildCard(type: ActionCardType): ActionCard {
  const config = ACTION_CARD_CONFIG[type];
  return {
    type,
    priority: ACTION_CARD_PRIORITY[type],
    title: config.title,
    description: config.description,
    ctaLabel: config.ctaLabel,
    ctaAction: config.ctaAction,
    colorScheme: config.colorScheme,
  };
}
