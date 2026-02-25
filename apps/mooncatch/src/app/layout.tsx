import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/Providers';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Mooncatch',
    template: '%s | Mooncatch',
  },
  description: 'Mooncatch',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className='min-h-screen'>
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
          <Toaster position='top-center' richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
