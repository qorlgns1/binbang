import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'AI Travel Planner',
  description: 'Plan your perfect trip with AI-powered recommendations, real-time weather, and currency exchange data.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='min-h-screen overflow-hidden'>{children}</body>
    </html>
  );
}
