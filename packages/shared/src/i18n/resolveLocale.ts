/**
 * i18n Core — Locale 협상(resolve) 순수 함수
 *
 * 우선순위: URL > userProfile(DB) > cookie > Accept-Language > default
 *
 * 순수(universal) 코드. Node built-in/env/네트워크 I/O 금지.
 */
import { DEFAULT_LOCALE, type Locale, isSupportedLocale } from './locale.ts';

/** locale 결정 근거 (디버깅/관측용) */
export type LocaleSource = 'url' | 'userProfile' | 'cookie' | 'acceptLanguage' | 'default';

/** resolveLocale 입력 */
export interface ResolveLocaleInput {
  /** URL에서 파싱한 locale (예: pathname의 첫 세그먼트) */
  url?: string | null;
  /** DB에 저장된 사용자 선호 locale */
  userPreferredLocale?: string | null;
  /** 쿠키에서 읽은 locale */
  cookie?: string | null;
  /** Accept-Language 헤더의 primary language tag */
  acceptLanguage?: string | null;
}

/** resolveLocale 출력 */
export interface ResolveLocaleResult {
  locale: Locale;
  source: LocaleSource;
}

/**
 * Locale 협상 알고리즘.
 *
 * 우선순위: URL > userProfile > cookie > Accept-Language > DEFAULT_LOCALE
 *
 * @param input - 각 소스에서 파싱한 locale 후보 (모두 선택적)
 * @returns 확정된 locale과 결정 근거
 */
export function resolveLocale(input: ResolveLocaleInput = {}): ResolveLocaleResult {
  if (input.url && isSupportedLocale(input.url)) {
    return { locale: input.url, source: 'url' };
  }

  if (input.userPreferredLocale && isSupportedLocale(input.userPreferredLocale)) {
    return { locale: input.userPreferredLocale, source: 'userProfile' };
  }

  if (input.cookie && isSupportedLocale(input.cookie)) {
    return { locale: input.cookie, source: 'cookie' };
  }

  if (input.acceptLanguage && isSupportedLocale(input.acceptLanguage)) {
    return { locale: input.acceptLanguage, source: 'acceptLanguage' };
  }

  return { locale: DEFAULT_LOCALE, source: 'default' };
}
