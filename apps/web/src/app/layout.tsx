import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { GoogleAnalytics } from '@/components/analytics';
import { Providers } from '@/components/providers';
import { getLocaleForHtmlLang } from '@/lib/i18n-runtime/server';

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
  return (
    <html lang={lang}>
      <head>
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
