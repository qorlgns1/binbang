import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { checkRateLimit, cleanupStore, getClientIp, getRateLimit } from '@/lib/rateLimit';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

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
  matcher: '/api/:path*',
};
