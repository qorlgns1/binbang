import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getTranslations } from 'next-intl/server';
import Script from 'next/script';

import { GoogleAnalytics } from '@/components/analytics';
import { Providers } from '@/components/Providers';
import { getLocaleForHtmlLang } from '@/lib/i18n-runtime/server';
import { SUPPORT_EMAIL } from '@/lib/support';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const BASE_URL =
  typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL.length > 0
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '')
    : 'https://binbang.moodybeard.com';

export const metadata: Metadata = {
  title: { default: '빈방', template: '%s | 빈방' },
  metadataBase: new URL(BASE_URL),
  // Title, description, openGraph, twitter are set per-route (Public pages use generateMetadata with locale/URL).
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': [process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || ''],
      'agd-partner-manual-verification': '',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLocaleForHtmlLang();
  const t = await getTranslations({ locale: lang, namespace: 'common' });
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${BASE_URL}/#organization`,
        name: 'Binbang',
        url: BASE_URL,
        logo: `${BASE_URL}/icon.png`,
        description: t('structuredData.organizationDescription'),
        contactPoint: {
          '@type': 'ContactPoint',
          email: SUPPORT_EMAIL,
          contactType: 'customer service',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        name: 'Binbang',
        url: BASE_URL,
        description: t('structuredData.websiteDescription'),
        publisher: { '@id': `${BASE_URL}/#organization` },
        inLanguage: ['ko', 'en', 'ja', 'zh-CN', 'es-419'],
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${BASE_URL}/#application`,
        name: t('structuredData.applicationName'),
        description: t('structuredData.applicationDescription'),
        url: BASE_URL,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KRW',
        },
        publisher: { '@id': `${BASE_URL}/#organization` },
      },
    ],
  };
  return (
    <html lang={lang}>
      <head>
        {/* JSON-LD: locale-specific descriptions from common messages */}
        <script
          type='application/ld+json'
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD from i18n messages
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Script id='theme-init' strategy='beforeInteractive'>{`
          (function() {
            try {
              var savedTheme = localStorage.getItem('binbang-theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              var isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
              document.documentElement.classList.toggle('dark', isDark);
            } catch (e) {}
          })();
        `}</Script>
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
