import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { Lang } from '@/lib/i18n/config';
import { checkRateLimit, cleanupStore, getClientIp, getRateLimit } from '@/lib/rateLimit';

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
