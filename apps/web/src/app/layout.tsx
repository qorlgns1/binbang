import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { GoogleAnalytics } from '@/components/analytics';
import { Providers } from '@/components/providers';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: '빈방어때 - 숙소 빈방 알림 서비스 | 에어비앤비·아고다 실시간 모니터링',
    template: '%s - 빈방어때',
  },
  description:
    '원하는 숙소가 품절됐나요? 빈방어때가 1분마다 자동으로 체크해서 빈방이 생기면 즉시 카카오톡으로 알려드립니다. 에어비앤비, 아고다 지원. 무료로 시작하세요.',
  keywords: ['숙소 빈방 알림', '숙소 예약 모니터링', '에어비앤비 알림', '아고다 알림', '숙소 가격 알림', '실시간 알림'],
  authors: [{ name: '빈방어때' }],
  creator: '빈방어때',
  publisher: '빈방어때',
  metadataBase: new URL('https://binbang.moodybeard.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://binbang.moodybeard.com',
    title: '빈방어때 - 당신의 휴식이 길을 잃지 않도록',
    description: '1분마다 체크하는 숙소 빈방 알림 서비스. 잠든 사이에도 당신을 지킵니다.',
    siteName: '빈방어때',
    images: [
      {
        url: '/icon.png',
        width: 1024,
        height: 1024,
        alt: '빈방어때 - 숙소 빈방 알림 서비스',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: '빈방어때 - 숙소 빈방 알림 서비스',
    description: '1분마다 체크하는 숙소 빈방 알림. 누구보다 빨리 전하는 가장 밝은 소식.',
    images: ['/icon.png'],
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('binbang-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = savedTheme ? savedTheme === 'dark' : prefersDark;
                  document.documentElement.classList.toggle('dark', isDark);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <GoogleAnalytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
