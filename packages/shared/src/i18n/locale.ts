/**
 * i18n Core — Locale 타입/상수/유틸
 *
 * 순수(universal) 코드. Node built-in/env/네트워크 I/O 금지.
 *
 * 1차 지원 locale: ko, en, ja, zh-CN, es-419 (ADR-9).
 */

/** 지원 Locale 타입 (1차: ko, en, ja, zh-CN, es-419) */
export type Locale = 'ko' | 'en' | 'ja' | 'zh-CN' | 'es-419';

/** 지원하는 모든 Locale 목록 */
export const SUPPORTED_LOCALES: readonly Locale[] = ['ko', 'en', 'ja', 'zh-CN', 'es-419'] as const;

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
 * 협상용 raw 문자열(쿠키/Accept-Language 등)을 지원 Locale로 매핑한다.
 *
 * 지역 매핑(ADR-9): zh-* → zh-CN, es-* → es-419.
 * 지원하지 않으면 null.
 *
 * @param raw - 협상에서 읽은 locale 문자열 (예: "zh", "zh-TW", "es", "es-419")
 * @returns 지원 Locale 또는 null
 */
export function mapToSupportedLocale(raw: string | null | undefined): Locale | null {
  if (raw == null || raw === '') return null;
  if (isSupportedLocale(raw)) return raw;
  const normalized = raw.toLowerCase();
  if (normalized.startsWith('zh')) return 'zh-CN';
  if (normalized.startsWith('es')) return 'es-419';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('ko')) return 'ko';
  return null;
}

/**
 * 문자열을 지원 Locale로 정규화한다. 지원하지 않는 값이면 DEFAULT_LOCALE을 반환한다.
 *
 * @param value - 정규화할 문자열 (null/undefined 허용)
 * @returns 유효한 Locale
 */
export function normalizeLocale(value: string | null | undefined): Locale {
  const mapped = mapToSupportedLocale(value);
  return mapped ?? DEFAULT_LOCALE;
}
