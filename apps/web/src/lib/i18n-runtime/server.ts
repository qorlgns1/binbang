/**
 * Web 서버 2차 locale 확정 (ADR-2).
 *
 * middleware 1차 협상(cookie/header/default)에 DB preferredLocale을 추가 반영한다.
 * RSC / API route에서 호출. Edge 불가(DB 접근 가능 환경 전용).
 *
 * 우선순위: URL > userPreferredLocale(DB) > cookie > Accept-Language > DEFAULT_LOCALE
 */
import { cookies, headers } from 'next/headers';

import {
  type Locale,
  isSupportedLocale,
  mapToSupportedLocale,
  type ResolveLocaleResult,
  resolveLocale,
} from '@workspace/shared/i18n';

const COOKIE_NAME = 'binbang-lang';

export interface ResolveServerLocaleInput {
  /** URL pathname에서 파싱한 locale (route param [lang]) */
  urlLocale?: string | null;
  /** DB에 저장된 사용자 선호 locale (세션에서 조회) */
  userPreferredLocale?: string | null;
}

/**
 * 서버 2차 locale 확정.
 *
 * Next.js 서버 컨텍스트(cookies, headers)에서 자동으로 cookie/Accept-Language를 읽고,
 * 호출자가 전달한 URL locale + DB preferredLocale과 함께 resolveLocale에 위임한다.
 */
export async function resolveServerLocale(input: ResolveServerLocaleInput = {}): Promise<ResolveLocaleResult> {
  const cookieStore = await cookies();
  const cookieRaw = cookieStore.get(COOKIE_NAME)?.value ?? null;
  const cookieLocale = cookieRaw ? (mapToSupportedLocale(cookieRaw) ?? null) : null;

  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  const primaryRaw = acceptLanguage?.split(',')[0]?.trim() ?? null;
  const headerLocale = primaryRaw
    ? (mapToSupportedLocale(primaryRaw) ?? mapToSupportedLocale(primaryRaw.split('-')[0]) ?? null)
    : null;

  return resolveLocale({
    url: input.urlLocale,
    userPreferredLocale: input.userPreferredLocale,
    cookie: cookieLocale,
    acceptLanguage: headerLocale,
  });
}

/**
 * Root layout의 <html lang>용 locale.
 *
 * pathname/헤더가 있으면 사용하고, 없으면 cookie·Accept-Language 협상.
 * [lang]이 없는 루트 레이아웃에서 접근성·SEO용 lang 속성 설정에 사용.
 */
export async function getLocaleForHtmlLang(): Promise<Locale> {
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname');
  if (pathname) {
    const segment = pathname.split('/')[1];
    if (segment && isSupportedLocale(segment)) return segment as Locale;
  }
  const headerLocale = headerStore.get('x-next-intl-locale');
  if (headerLocale && isSupportedLocale(headerLocale)) return headerLocale as Locale;
  const { locale } = await resolveServerLocale({});
  return locale;
}
