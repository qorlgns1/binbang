import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { Lang } from '@/lib/i18n/config';
import { checkRateLimit, cleanupStore, getClientIp, getRateLimit } from '@/lib/rateLimit';

/**
 * Determine the request language preference using cookie, then Accept-Language header, defaulting to `ko`.
 *
 * @param request - The incoming Next.js request whose cookies and headers are inspected for language preference
 * @returns `'ko'` or `'en'` — chosen from the `binbang-lang` cookie if present and valid, otherwise from the request's `Accept-Language` primary tag, or `'ko'` if neither yields a supported language
 */
function detectLang(request: NextRequest): Lang {
  // 1순위: 쿠키
  const langCookie = request.cookies.get('binbang-lang');
  if (langCookie?.value === 'ko' || langCookie?.value === 'en') {
    return langCookie.value;
  }

  // 2순위: Accept-Language
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLang = acceptLanguage.split(',')[0]?.split('-')[0];
    if (preferredLang === 'ko') return 'ko';
    if (preferredLang === 'en') return 'en';
  }

  // 3순위: 기본값
  return 'ko';
}

/**
 * Handles root-path language redirects and enforces rate limits for API routes.
 *
 * Depending on the request path, this middleware either redirects the root path to a language-prefixed URL, bypasses rate limiting for non-API paths, rejects requests that exceed the rate limit, or forwards allowed requests while attaching rate-limit headers.
 *
 * @returns A NextResponse that is one of:
 *  - a 302 redirect to "/{lang}" for the root path;
 *  - a 429 JSON response `{ error: 'Too many requests' }` with `Retry-After`, `X-RateLimit-Limit`, and `X-RateLimit-Remaining: 0` when the client is rate limited;
 *  - or a next response with `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers for allowed requests (or a plain next response for paths not subject to rate limiting).
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // / 경로: 언어 감지 후 302 redirect
  if (pathname === '/') {
    const lang = detectLang(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}`;
    return NextResponse.redirect(url, { status: 302 });
  }

  // Rate limit 체크 (API 경로만)
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
  matcher: ['/', '/api/:path*'],
};
