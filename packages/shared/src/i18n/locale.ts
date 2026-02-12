/**
 * i18n Core — Locale 타입/상수/유틸
 *
 * 순수(universal) 코드. Node built-in/env/네트워크 I/O 금지.
 */

/** 지원 Locale 타입 (향후 'en-US' 등 확장 가능) */
export type Locale = 'ko' | 'en';

/** 지원하는 모든 Locale 목록 */
export const SUPPORTED_LOCALES: readonly Locale[] = ['ko', 'en'] as const;

/** 기본 Locale (폴백용) */
export const DEFAULT_LOCALE: Locale = 'ko';

/**
 * 문자열이 지원되는 Locale인지 검사하는 타입 가드.
 *
 * @param value - 검사할 문자열
 * @returns 지원 Locale이면 true
 */
export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * 문자열을 지원 Locale로 정규화한다. 지원하지 않는 값이면 DEFAULT_LOCALE을 반환한다.
 *
 * @param value - 정규화할 문자열 (null/undefined 허용)
 * @returns 유효한 Locale
 */
export function normalizeLocale(value: string | null | undefined): Locale {
  if (value && isSupportedLocale(value)) return value;
  return DEFAULT_LOCALE;
}
