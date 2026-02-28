import type { AvailabilityStatus } from '@workspace/db/enums';

import type { Accommodation } from '@/types/accommodation';

type StatusContext = Pick<Accommodation, 'lastStatus' | 'platformId' | 'lastPolledAt' | 'lastCheck' | 'lastEventAt'>;

function getLastActivity(accommodation: StatusContext): string | null {
  return accommodation.platformId ? accommodation.lastPolledAt : accommodation.lastCheck;
}

function isUnknown(status: AvailabilityStatus): boolean {
  return status === 'UNKNOWN';
}

/**
 * UNKNOWN 상태를 유저 친화적인 텍스트로 변환한다.
 */
export function resolveUnknownStatusText(accommodation: StatusContext): string {
  const lastActivity = getLastActivity(accommodation);
  if (!lastActivity) return '확인 대기';
  return '확인 중';
}

/**
 * 대시보드의 "문제 숙소" 기준.
 * - ERROR는 항상 문제
 * - UNKNOWN은 초기 확인 대기(아직 한번도 체크 안 됨)만 제외
 */
export function isProblemStatus(accommodation: StatusContext): boolean {
  if (accommodation.lastStatus === 'ERROR') return true;
  if (!isUnknown(accommodation.lastStatus)) return false;
  return getLastActivity(accommodation) !== null;
}

/**
 * 내부 오류 문자열을 사용자 안내 문구로 정규화한다.
 */
export function toUserFacingErrorMessage(rawMessage: string): string {
  const normalized = rawMessage.trim();
  const lower = normalized.toLowerCase();

  if (lower.includes('credentials required') || lower.includes('api key')) {
    return '예약처 인증 설정 문제로 확인이 실패했어요.';
  }
  if (lower.includes('fetch failed') || lower.includes('network') || lower.includes('timeout')) {
    return '예약처와 통신이 원활하지 않아 확인이 실패했어요.';
  }
  if (lower.includes('429') || lower.includes('rate limit')) {
    return '요청이 많아 일시적으로 확인이 지연되고 있어요.';
  }
  if (lower.includes('not active')) {
    return '현재 모니터링이 꺼져 있어 상태를 확인할 수 없어요.';
  }
  return normalized;
}
