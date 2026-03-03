import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Default locale(ko) has no prefix; others keep prefix (/en/*)
  localePrefix: 'as-needed',
});

export const config = {
  // Match only internationalized pathnames
  // Skip /api, /_next, and static files
  matcher: ['/', '/(ko|en)/:path*', '/((?!api|_next|_vercel|login|monitoring|.*\\..*).*)'],
};
