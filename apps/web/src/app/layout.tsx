import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { GoogleAnalytics } from '@/components/analytics';
import { Providers } from '@/components/providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: '빈방', template: '%s | 빈방' },
  metadataBase: new URL('https://binbang.moodybeard.com'),
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko'>
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
