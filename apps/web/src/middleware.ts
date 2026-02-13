import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { DEFAULT_LOCALE, type Locale, isSupportedLocale } from '@workspace/shared/i18n';

import { checkRateLimit, cleanupStore, getClientIp, getRateLimit } from '@/lib/rateLimit';

/**
 * URL pathname에서 locale prefix를 파싱한다.
 *
 * @example parseLocaleFromPath("/ko/landing") → "ko"
 * @example parseLocaleFromPath("/dashboard") → null
 */
function parseLocaleFromPath(pathname: string): Locale | null {
  const segment = pathname.split('/')[1];
  return segment && isSupportedLocale(segment) ? segment : null;
}

/**
 * Edge-safe 1차 locale 협상 (DB 접근 금지).
 *
 * 우선순위: cookie(`binbang-lang`) > Accept-Language > DEFAULT_LOCALE
 * DB(`preferredLocale`)는 서버 2차 확정에서 반영한다 (ADR-2).
 */
function negotiateLocale(request: NextRequest): Locale {
  // 1순위: 쿠키
  const cookieLocale = request.cookies.get('binbang-lang')?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

  // 2순위: Accept-Language
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const primary = acceptLanguage.split(',')[0]?.split('-')[0];
    if (primary && isSupportedLocale(primary)) {
      return primary;
    }
  }

  // 3순위: 기본값
  return DEFAULT_LOCALE;
}

/** locale prefix 없이 접근 가능한 public 경로 (redirect 대상) */
const PUBLIC_PATHS = ['/login', '/signup', '/pricing', '/terms', '/privacy'];

/** next-intl이 getRequestConfig의 requestLocale으로 읽는 헤더 (서버로 전달) */
const NEXT_INTL_LOCALE_HEADER = 'X-NEXT-INTL-LOCALE';

/**
 * Locale 협상 + Rate Limiting middleware.
 *
 * - URL에 locale prefix가 있으면 통과 (next-intl용 locale 헤더 설정)
 * - root "/" 또는 public 경로 → locale 협상 후 redirect
 * - API 경로 → rate limit 적용
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1) URL에 locale prefix가 있으면 통과 (next-intl에 path 기반 locale 전달)
  const pathLocale = parseLocaleFromPath(pathname);
  if (pathLocale) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(NEXT_INTL_LOCALE_HEADER, pathLocale);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2) root "/" 또는 public 경로 → locale 협상 후 redirect
  if (pathname === '/' || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const locale = negotiateLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url, { status: 302 });
  }

  // 3) Rate limit 체크 (API 경로만)
  const limit = getRateLimit(pathname);
  if (limit === null) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const result = checkRateLimit(ip, limit);

  cleanupStore();

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  return response;
}

export const config = {
  matcher: ['/', '/ko/:path*', '/en/:path*', '/api/:path*', '/login', '/signup', '/pricing', '/terms', '/privacy'],
};
