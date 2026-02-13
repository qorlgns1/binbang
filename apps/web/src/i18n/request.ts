/**
 * next-intl server request configuration.
 *
 * 각 요청에 대해 locale과 messages를 결정한다.
 * - (public)/[lang] 라우트: URL param에서 locale 결정
 * - (app) 라우트: cookie에서 locale 결정 (fallback: DEFAULT_LOCALE)
 *
 * Namespace slicing: middleware가 전달하는 x-pathname 헤더를 읽어
 * 해당 라우트에 필요한 namespace만 로드한다.
 */
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

import { DEFAULT_LOCALE, type Locale, isSupportedLocale, mapToSupportedLocale } from '@workspace/shared/i18n';

import { getAllNamespaces, getNamespacesForPathname } from './namespaces';

/** namespace명 → 동적 import 매핑. 번들러가 각 JSON을 별도 chunk로 분리한다. */
const loaders: Record<string, (locale: Locale) => Promise<Record<string, unknown>>> = {
  common: (l) => import(`../../messages/${l}/common.json`).then((m) => m.default),
  landing: (l) => import(`../../messages/${l}/landing.json`).then((m) => m.default),
  legal: (l) => import(`../../messages/${l}/legal.json`).then((m) => m.default),
  auth: (l) => import(`../../messages/${l}/auth.json`).then((m) => m.default),
  pricing: (l) => import(`../../messages/${l}/pricing.json`).then((m) => m.default),
  faq: (l) => import(`../../messages/${l}/faq.json`).then((m) => m.default),
  about: (l) => import(`../../messages/${l}/about.json`).then((m) => m.default),
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // (app) routes without [lang] param: fallback to cookie (map raw to supported locale)
  if (!locale || !isSupportedLocale(locale)) {
    const cookieStore = await cookies();
    const cookieRaw = cookieStore.get('binbang-lang')?.value;
    const cookieLocale = cookieRaw ? mapToSupportedLocale(cookieRaw) : null;
    locale = cookieLocale ?? DEFAULT_LOCALE;
  }

  const validLocale = locale as Locale;

  // Namespace slicing: pathname 기반으로 필요한 namespace만 로드
  const headerStore = await headers();
  const pathname = headerStore.get('x-pathname');
  const namespaces = pathname ? getNamespacesForPathname(pathname) : getAllNamespaces();

  const entries = await Promise.all(
    namespaces.map(async (ns) => {
      const loader = loaders[ns];
      if (!loader) return null;
      return [ns, await loader(validLocale)] as const;
    }),
  );

  const messages = Object.fromEntries(entries.filter(Boolean) as [string, Record<string, unknown>][]);

  return { locale: validLocale, messages };
});
