/**
 * Public SEO helpers: base URL, canonical and hreflang alternates for [lang] routes.
 * Used by sitemap and Public page metadata (WU-16).
 */

import { type Locale, SUPPORTED_LOCALES } from '@workspace/shared/i18n';

const RAW_BASE =
  typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL.length > 0
    ? process.env.NEXT_PUBLIC_APP_URL
    : 'https://binbang.moodybeard.com';

/** Trailing slash 제거하여 canonical/hreflang 이중 슬래시 방지 */
const BASE_URL = RAW_BASE.replace(/\/+$/, '');

export function getBaseUrl(): string {
  return BASE_URL;
}

/** Public path segments (no leading slash for root). Used for sitemap and canonical. */
export const PUBLIC_PATHS = ['', '/pricing', '/faq', '/login', '/signup', '/terms', '/privacy'] as const;

/**
 * Build canonical URL and hreflang alternates for a Public page.
 * @param lang - Current locale
 * @param path - Path segment after /[lang], e.g. '' or '/pricing'
 */
export function buildPublicAlternates(
  lang: Locale,
  path: string,
): { canonical: string; languages: Record<string, string> } {
  const canonical = `${BASE_URL}/${lang}${path}`;
  const languages: Record<string, string> = {};
  for (const l of SUPPORTED_LOCALES) {
    languages[l] = `${BASE_URL}/${l}${path}`;
  }
  return { canonical, languages };
}

/** OpenGraph locale string for the given lang (e.g. ko_KR, en_US). */
export function getOgLocale(lang: Locale): string {
  switch (lang) {
    case 'ko':
      return 'ko_KR';
    case 'en':
      return 'en_US';
    case 'ja':
      return 'ja_JP';
    case 'zh-CN':
      return 'zh_CN';
    case 'es-419':
      return 'es_419';
    default:
      return 'en_US';
  }
}

/** Default OG image used by Public pages (relative path; resolved via metadataBase). */
export const DEFAULT_OG_IMAGE = { url: '/icon.png', width: 1024, height: 1024, alt: 'Binbang' } as const;
