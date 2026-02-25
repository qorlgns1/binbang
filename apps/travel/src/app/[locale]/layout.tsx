import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { Toaster } from 'sonner';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/Providers';
import { locales } from '@/i18n';

import '../globals.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.hero' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  const title = tCommon('appName');
  const description = t('subtitle');

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    keywords: ['travel', 'AI', 'planner', 'weather', 'exchange rate', 'vacation', 'trip'],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      siteName: title,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ko: '/ko',
        en: '/en',
      },
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale
  setRequestLocale(locale);

  // Fetch messages for the locale
  const messages = await getMessages({ locale });
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className='min-h-screen'>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy='afterInteractive' />
            <Script id='gtag-init' strategy='afterInteractive'>
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`}
            </Script>
          </>
        )}
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ErrorBoundary>{children}</ErrorBoundary>
            <Toaster position='top-center' richColors closeButton />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
