/**
 * next-intl server request configuration.
 *
 * 각 요청에 대해 locale과 messages를 결정한다.
 * - (public)/[lang] 라우트: URL param에서 locale 결정
 * - (app) 라우트: cookie에서 locale 결정 (fallback: DEFAULT_LOCALE)
 */
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

import { DEFAULT_LOCALE, type Locale, isSupportedLocale } from '@workspace/shared/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // (app) routes without [lang] param: fallback to cookie
  if (!locale || !isSupportedLocale(locale)) {
    const cookieStore = await cookies();
    const cookieLang = cookieStore.get('binbang-lang')?.value;
    locale = cookieLang && isSupportedLocale(cookieLang) ? cookieLang : DEFAULT_LOCALE;
  }

  const validLocale = locale as Locale;
  const common = (await import(`../../messages/${validLocale}/common.json`)).default;
  const landing = (await import(`../../messages/${validLocale}/landing.json`)).default;
  const legal = (await import(`../../messages/${validLocale}/legal.json`)).default;
  const auth = (await import(`../../messages/${validLocale}/auth.json`)).default;
  const pricing = (await import(`../../messages/${validLocale}/pricing.json`)).default;

  return {
    locale: validLocale,
    messages: { common, landing, legal, auth, pricing },
  };
});
