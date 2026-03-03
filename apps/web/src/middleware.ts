import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { DEFAULT_LOCALE, type Locale, isSupportedLocale, mapToSupportedLocale } from '@workspace/shared/i18n';

import { isPublicPath, stripLocalePrefix } from '@/lib/i18n-runtime/publicPath';
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

function addLocalePrefix(pathname: string, locale: Locale): string {
  return pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
}

/**
 * Edge-safe 1차 locale 협상 (DB 접근 금지).
 *
 * 우선순위: cookie(`binbang-lang`) > Accept-Language > DEFAULT_LOCALE
 * DB(`preferredLocale`)는 서버 2차 확정에서 반영한다 (ADR-2).
 * zh-* → zh-CN, es-* → es-419 매핑 적용 (ADR-9).
 */
function negotiateLocale(request: NextRequest): Locale {
  const cookieRaw = request.cookies.get('binbang-lang')?.value;
  const cookieLocale = cookieRaw ? mapToSupportedLocale(cookieRaw) : null;
  if (cookieLocale) return cookieLocale;

  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const primary = acceptLanguage.split(',')[0]?.trim();
    const headerLocale = primary
      ? (mapToSupportedLocale(primary) ?? mapToSupportedLocale(primary.split('-')[0]))
      : null;
    if (headerLocale) return headerLocale;
  }

  return DEFAULT_LOCALE;
}

/** next-intl이 getRequestConfig의 requestLocale으로 읽는 헤더 (서버로 전달) */
const NEXT_INTL_LOCALE_HEADER = 'X-NEXT-INTL-LOCALE';

/**
 * Locale 협상 + Rate Limiting middleware.
 *
 * - URL에 default locale prefix(/ko)가 있으면 prefix 없는 canonical로 redirect
 * - URL에 non-default locale prefix가 있으면 통과 (next-intl용 locale 헤더 설정)
 * - public 경로에 locale prefix가 없으면:
 *   - default locale: 내부 rewrite (/ko/*)
 *   - non-default locale: locale prefix 경로로 redirect
 * - API 경로 → rate limit 적용
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1) URL에 locale prefix가 있으면 처리
  const pathLocale = parseLocaleFromPath(pathname);
  if (pathLocale) {
    // default locale(ko)는 prefix 없는 canonical 경로로 영구 리다이렉트
    if (pathLocale === DEFAULT_LOCALE) {
      const { pathname: canonicalPath } = stripLocalePrefix(pathname);
      const url = request.nextUrl.clone();
      url.pathname = canonicalPath;
      return NextResponse.redirect(url, { status: 308 });
    }

    // non-default locale은 prefix 유지
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(NEXT_INTL_LOCALE_HEADER, pathLocale);
    requestHeaders.set('x-pathname', pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 2) locale prefix 없는 public 경로 처리
  if (isPublicPath(pathname)) {
    const locale = negotiateLocale(request);

    // default locale(ko)는 URL은 유지하고 내부적으로 /ko/*로 rewrite
    if (locale === DEFAULT_LOCALE) {
      const rewrittenPath = addLocalePrefix(pathname, DEFAULT_LOCALE);
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(NEXT_INTL_LOCALE_HEADER, DEFAULT_LOCALE);
      requestHeaders.set('x-pathname', rewrittenPath);

      const url = request.nextUrl.clone();
      url.pathname = rewrittenPath;
      return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    }

    // non-default locale은 locale prefix로 redirect
    const url = request.nextUrl.clone();
    url.pathname = addLocalePrefix(pathname, locale);
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
  matcher: [
    '/',
    '/about',
    '/faq',
    '/availability',
    '/availability/:path*',
    '/login',
    '/signup',
    '/pricing',
    '/terms',
    '/privacy',
    '/ko/:path*',
    '/en/:path*',
    '/ja/:path*',
    '/zh-CN/:path*',
    '/es-419/:path*',
    '/api/:path*',
  ],
};
