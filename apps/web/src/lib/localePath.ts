import { DEFAULT_LOCALE } from '@workspace/shared/i18n';

function normalizePath(path: string): string {
  if (path === '' || path === '/') return '/';
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash;
}

/**
 * Build localized path where default locale(ko) is unprefixed.
 */
export function buildLocalePath(locale: string, path: string): string {
  const normalized = normalizePath(path);
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}
