import { ACTION_CARDS_MAX, ACTION_CARD_CONFIG, ACTION_CARD_PRIORITY } from './constants';
import type { ActionCard, ActionCardType, DashboardMetrics } from './types';

/**
 * Generate up to three prioritized dashboard action cards based on provided metrics and Kakao token state.
 *
 * Candidates are selected for QUOTA_REACHED, RECENT_ERROR_DETECTED, NOTIFICATION_NOT_CONNECTED,
 * QUOTA_NEAR_LIMIT, and PAUSED_ACCOMMODATIONS_EXIST. If quota is reached, the near-limit card is suppressed.
 *
 * @param metrics - Dashboard metrics used to determine applicable action cards
 * @param hasKakaoToken - Whether a Kakao notification token is present
 * @returns An array of ActionCard objects sorted by descending priority, containing at most ACTION_CARDS_MAX items
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

/**
 * Builds an ActionCard object for the given action card type using configured templates.
 *
 * @param type - The action card type whose configured template and priority will be used
 * @returns An ActionCard populated with its type, priority, title, description, CTA label/action, and color scheme
 */
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
