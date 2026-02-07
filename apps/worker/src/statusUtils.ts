import type { AvailabilityStatus } from '@workspace/db';

/**
 * 체크 결과로부터 가용성 상태 결정
 */
export function determineStatus(result: { error: string | null; available: boolean }): AvailabilityStatus {
  if (result.error) return 'ERROR';
  if (result.available) return 'AVAILABLE';
  return 'UNAVAILABLE';
}

/**
 * 두 날짜 사이의 숙박 일수(박) 계산.
 * 시/분/초를 무시하고 연/월/일 기준 차이를 반환한다.
 * 결과가 0 이하이면 최소 1을 반환 (0으로 나누기 방지).
 */
export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const inDay = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const outDay = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
  const nights = Math.round((outDay - inDay) / (1000 * 60 * 60 * 24));
  return Math.max(nights, 1);
}

/**
 * 두 일정(체크인/체크아웃)이 연/월/일 기준으로 동일한지 비교.
 * 시/분/초는 무시한다.
 */
export function isSameStayDates(a: { checkIn: Date; checkOut: Date }, b: { checkIn: Date; checkOut: Date }): boolean {
  return toDateStr(a.checkIn) === toDateStr(b.checkIn) && toDateStr(a.checkOut) === toDateStr(b.checkOut);
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * 예약 가능 알림 전송 여부 판단
 * AVAILABLE로 전환되었고, 이전에 AVAILABLE이 아니었으며, 카카오 토큰이 있을 때만 전송
 */
export function shouldSendAvailabilityNotification(
  status: AvailabilityStatus,
  lastStatus: AvailabilityStatus | null,
  hasKakaoToken: boolean,
): boolean {
  return status === 'AVAILABLE' && lastStatus !== 'AVAILABLE' && Boolean(hasKakaoToken);
}
