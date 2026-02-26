import { expect, type APIResponse, type Page } from '@playwright/test';

/**
 * 테스트 전용 Agoda mock 응답 시나리오 타입.
 *
 * - `sold_out`: Agoda Search API 결과가 비어 있는 상태(호텔 결과 없음)
 * - `available`: Agoda Search API 결과에 최소 1개 오퍼가 있는 상태
 */
export type AgodaMockScenario = 'sold_out' | 'available';

/**
 * 내부 poll API 응답에서 vacancy 관련 핵심 필드만 추린 타입.
 *
 * 참고:
 * - 실제 서비스 응답은 더 많은 필드를 포함하지만,
 *   vacancy 회귀 검증에 필요한 최소 필드만 명시해 테스트 가독성을 높인다.
 */
export interface PollVacancyMetrics {
  snapshotsInserted: number;
  vacancyEventsDetected: number;
  vacancyEventsRejectedByVerify: number;
  vacancyEventsInserted: number;
  vacancyEventsSkippedByCooldown: number;
  notificationsQueued: number;
}

/**
 * 알림 이력 API(`/api/accommodations/{id}/notifications`)의 단일 아이템 타입.
 */
export interface NotificationHistoryItem {
  notificationId: string;
  eventId: string;
  type: string;
  status: string;
  sentAt: string | null;
  detectedAt: string;
}

interface PollApiEnvelope {
  ok: boolean;
  result: PollVacancyMetrics;
}

interface NotificationHistoryEnvelope {
  notifications: NotificationHistoryItem[];
}

/**
 * 응답이 성공(2xx)이 아니면 디버깅 가능한 에러를 만들어 throw한다.
 *
 * 목적:
 * - Playwright assertion 실패 대신 "어떤 API가 왜 실패했는지"를 즉시 보여준다.
 *
 * @param response 검증 대상 응답
 * @param context 에러 메시지용 컨텍스트 문자열
 */
async function assertOkResponse(response: APIResponse, context: string): Promise<void> {
  if (response.ok()) {
    return;
  }

  const body = await response.text().catch(() => '');
  throw new Error(`${context} failed: status=${response.status()} body=${body}`);
}

/**
 * 테스트 전용 Agoda mock 시나리오를 전환한다.
 *
 * @param page Playwright page 인스턴스
 * @param scenario 적용할 mock 시나리오
 */
export async function setAgodaMockScenario(page: Page, scenario: AgodaMockScenario): Promise<void> {
  const response = await page.request.post('/api/test/agoda-mock/config', {
    data: { scenario },
  });
  await assertOkResponse(response, 'setAgodaMockScenario');
}

/**
 * 특정 accommodation에 대해 내부 poll API를 1회 실행하고 vacancy 지표를 반환한다.
 *
 * @param page Playwright page 인스턴스
 * @param accommodationId 폴링 대상 accommodation ID
 * @returns vacancy 회귀 검증에 필요한 poll 결과 지표
 */
export async function pollAccommodationOnceById(page: Page, accommodationId: string): Promise<PollVacancyMetrics> {
  const response = await page.request.post(`/api/internal/accommodations/${accommodationId}/poll`);
  await assertOkResponse(response, 'pollAccommodationOnceById');

  const body = (await response.json()) as PollApiEnvelope;
  expect(body.ok).toBeTruthy();
  return body.result;
}

/**
 * 특정 accommodation의 알림 이력을 조회한다.
 *
 * @param page Playwright page 인스턴스
 * @param accommodationId 조회 대상 accommodation ID
 * @returns 최신순 알림 이력 목록
 */
export async function getNotificationHistory(page: Page, accommodationId: string): Promise<NotificationHistoryItem[]> {
  const response = await page.request.get(`/api/accommodations/${accommodationId}/notifications`);
  await assertOkResponse(response, 'getNotificationHistory');

  const body = (await response.json()) as NotificationHistoryEnvelope;
  return body.notifications;
}
