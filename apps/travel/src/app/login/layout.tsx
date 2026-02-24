import type { Metadata } from 'next';
import { Suspense } from 'react';

import '../globals.css';

export const metadata: Metadata = {
  title: '로그인',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className='min-h-screen overflow-hidden'>
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
