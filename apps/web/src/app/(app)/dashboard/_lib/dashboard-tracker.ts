/**
 * Dashboard Analytics Tracker
 * Implements TR-001 ~ TR-012 from dashboard-action-center-implementation-spec.md
 */
import crypto from 'crypto';

type DashboardEvent =
  | 'dashboard_viewed'
  | 'dashboard_action_card_impression'
  | 'dashboard_action_card_clicked'
  | 'dashboard_board_tab_changed'
  | 'dashboard_retry_clicked';

interface EventParams {
  user_id: string;
  screen: 'dashboard';
  timestamp: string;
  [key: string]: string | undefined;
}

// 모듈 레벨 세션 관리 (landing-tracker.ts 패턴)
let sessionId: string | null = null;
const sentEvents = new Set<string>();

/**
 * Get a cached session identifier, generating and storing a new unique one on first call.
 *
 * @returns The session identifier string, stable for the lifetime of the module after first generation.
 */
function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${crypto.randomUUID()}`;
  }
  return sessionId;
}

/**
 * Builds base event parameters for dashboard analytics, attaching the user identifier, screen name, and current timestamp.
 *
 * @param userId - The identifier of the user associated with the event
 * @returns An object containing `user_id`, `screen`, and `timestamp` for dashboard events
 */
function buildCommonParams(userId: string): EventParams {
  return {
    user_id: userId,
    screen: 'dashboard',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Record a single dashboard view event for the current session.
 *
 * Sends a 'dashboard_viewed' event with common dashboard parameters the first time it is called in a session;
 * subsequent calls during the same session are ignored.
 *
 * @param userId - The unique identifier of the user associated with the event
 */
export function trackDashboardViewed(userId: string): void {
  const eventKey = `${getSessionId()}_dashboard_viewed`;
  if (sentEvents.has(eventKey)) return;

  const params = buildCommonParams(userId);
  sendEvent('dashboard_viewed', params);
  sentEvents.add(eventKey);
}

/**
 * Record a single impression per session for the specified dashboard action card type.
 *
 * @param userId - The user ID associated with the impression event
 * @param cardType - Identifier of the action card type; impressions are deduplicated once per session for each distinct `cardType`
 */
export function trackActionCardImpression(userId: string, cardType: string): void {
  const eventKey = `${getSessionId()}_${cardType}`;
  if (sentEvents.has(eventKey)) return;

  const params = buildCommonParams(userId);
  params.card_type = cardType;
  sendEvent('dashboard_action_card_impression', params);
  sentEvents.add(eventKey);
}

/**
 * Record an action-card click event including the card type and user context for every invocation.
 *
 * Sends a `dashboard_action_card_clicked` event with common parameters plus `card_type`; this is emitted on each call (no deduplication).
 *
 * @param userId - The identifier of the user who clicked the card
 * @param cardType - The action card's type or identifier
 */
export function trackActionCardClicked(userId: string, cardType: string): void {
  const params = buildCommonParams(userId);
  params.card_type = cardType;
  sendEvent('dashboard_action_card_clicked', params);
}

/**
 * Record a dashboard board tab change for analytics.
 *
 * @param userId - The identifier of the user who changed the tab
 * @param tabName - The new tab name or identifier
 */
export function trackBoardTabChanged(userId: string, tabName: string): void {
  const params = buildCommonParams(userId);
  params.tab_name = tabName;
  sendEvent('dashboard_board_tab_changed', params);
}

/**
 * Record a retry button click on the dashboard.
 *
 * @param userId - The identifier of the user who triggered the retry
 */
export function trackRetryClicked(userId: string): void {
  const params = buildCommonParams(userId);
  sendEvent('dashboard_retry_clicked', params);
}

/**
 * Sends a dashboard analytics event; logs the event in development and swallows any transmission errors so the UI is not affected.
 *
 * @param eventName - The dashboard event name to send
 * @param params - Event parameters (must include `user_id`, `screen`, and `timestamp`; may include additional string fields)
 */
function sendEvent(eventName: DashboardEvent, params: EventParams): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Dashboard Analytics]', eventName, params);
  }

  try {
    // TODO: 실제 분석 서비스로 전송 (Google Analytics, Mixpanel 등)
    // gtag('event', eventName, params);
  } catch {
    // TR-011: 실패 시 UI 차단 없이 무시
  }
}