import { DEFAULT_LOCALE, type Locale, isSupportedLocale } from '@workspace/shared/i18n';

const PUBLIC_STATIC_PATHS = new Set([
  '/',
  '/availability',
  '/pricing',
  '/faq',
  '/about',
  '/login',
  '/signup',
  '/terms',
  '/privacy',
  '/chat',
  '/destinations',
]);

function normalizePath(path: string): string {
  if (path === '' || path === '/') return '/';
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

export function stripLocalePrefix(pathname: string): { locale: Locale | null; pathname: string } {
  const normalized = normalizePath(pathname);
  const segments = normalized.split('/');
  const maybeLocale = segments[1];

  if (maybeLocale && isSupportedLocale(maybeLocale)) {
    const rest = segments.slice(2).join('/');
    return { locale: maybeLocale, pathname: rest.length > 0 ? `/${rest}` : '/' };
  }

  return { locale: null, pathname: normalized };
}

export function isPublicPath(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  if (PUBLIC_STATIC_PATHS.has(normalized)) return true;
  if (normalized.startsWith('/availability/')) return true;
  if (normalized.startsWith('/destinations/')) return true;
  return false;
}

/**
 * Build public URL path by locale.
 * - default locale(ko): no prefix (`/pricing`)
 * - non-default locale: prefixed (`/en/pricing`)
 */
export function buildPublicPath(locale: Locale | string, path: string): string {
  const normalized = normalizePath(path);
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}
