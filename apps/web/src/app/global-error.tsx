'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import './globals.css';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang='ko'>
      <body className='flex min-h-screen flex-col items-center justify-center gap-4 px-4'>
        <p className='text-center font-medium text-foreground'>문제가 발생했어요</p>
        <p className='text-center text-sm text-muted-foreground'>잠시 후 다시 시도해 주세요.</p>
        <button
          type='button'
          onClick={reset}
          className='rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
