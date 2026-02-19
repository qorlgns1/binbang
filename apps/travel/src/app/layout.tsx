import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Providers } from '@/components/Providers';

import './globals.css';

export const metadata: Metadata = {
  title: 'AI Travel Planner',
  description: 'Plan your perfect trip with AI-powered recommendations, real-time weather, and currency exchange data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='min-h-screen overflow-hidden'>
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
          <Toaster position='top-center' richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
