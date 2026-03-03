import { defaultLocale } from '@/i18n';

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
  if (locale === defaultLocale) return normalized;
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}
