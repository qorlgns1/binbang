/**
 * 공통 날짜 유틸리티
 *
 * UTC 기준 날짜 연산을 제공합니다.
 */

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * UTC 기준 하루의 시작 시각 (00:00:00.000) 반환
 */
export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

/**
 * UTC 기준 하루의 마지막 시각 (23:59:59.999) 반환
 */
export function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

/**
 * UTC 기준 날짜에 일수 추가
 */
export function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}
