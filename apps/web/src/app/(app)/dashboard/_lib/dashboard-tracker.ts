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

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${crypto.randomUUID()}`;
  }
  return sessionId;
}

function buildCommonParams(userId: string): EventParams {
  return {
    user_id: userId,
    screen: 'dashboard',
    timestamp: new Date().toISOString(),
  };
}

/**
 * TR-005: dashboard_viewed는 최초 완전 렌더 시 1회 전송
 */
export function trackDashboardViewed(userId: string): void {
  const eventKey = `${getSessionId()}_dashboard_viewed`;
  if (sentEvents.has(eventKey)) return;

  const params = buildCommonParams(userId);
  sendEvent('dashboard_viewed', params);
  sentEvents.add(eventKey);
}

/**
 * TR-006/007: 카드 impression은 카드 타입별 세션당 1회
 * 중복 제거 키: session_id + card_type
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
 * TR-008: CTA 클릭마다 즉시 1회 전송
 */
export function trackActionCardClicked(userId: string, cardType: string): void {
  const params = buildCommonParams(userId);
  params.card_type = cardType;
  sendEvent('dashboard_action_card_clicked', params);
}

/**
 * TR-009: 탭 변경은 실제 값이 바뀐 경우에만 전송
 */
export function trackBoardTabChanged(userId: string, tabName: string): void {
  const params = buildCommonParams(userId);
  params.tab_name = tabName;
  sendEvent('dashboard_board_tab_changed', params);
}

/**
 * TR-010: 오류 카드 버튼 클릭마다 전송
 */
export function trackRetryClicked(userId: string): void {
  const params = buildCommonParams(userId);
  sendEvent('dashboard_retry_clicked', params);
}

/**
 * TR-011: 트래킹 실패는 UI 동작 차단 없이 무시
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
