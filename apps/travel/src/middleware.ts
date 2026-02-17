import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Redirect to default locale if no locale prefix is present
  localePrefix: 'always',
});

export const config = {
  // Match only internationalized pathnames
  // Skip /api, /_next, and static files
  matcher: ['/', '/(ko|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)'],
};
