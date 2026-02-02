import type { AvailabilityStatus } from '@/generated/prisma/client';

/**
 * 체크 결과로부터 가용성 상태 결정
 */
export function determineStatus(result: { error: string | null; available: boolean }): AvailabilityStatus {
  if (result.error) return 'ERROR';
  if (result.available) return 'AVAILABLE';
  return 'UNAVAILABLE';
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
