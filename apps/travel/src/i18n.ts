import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  if (!hasLocale(locales, requested)) {
    notFound();
  }

  return {
    locale: requested,
    messages: (await import(`../messages/${requested}.json`)).default,
  };
});
