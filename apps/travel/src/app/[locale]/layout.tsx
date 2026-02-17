import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
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
  if (!locales.includes(locale as never)) {
    notFound();
  }

  // Fetch messages for the locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className='min-h-screen overflow-hidden'>
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
