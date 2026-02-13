import type { ReactNode } from 'react';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { AppHeader } from '@/components/app-header';
import { authOptions } from '@/lib/auth';
import { resolveServerLocale } from '@/lib/i18n-runtime/server';

export default async function AppLayout({ children }: { children: ReactNode }): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect('/login');

  const { locale } = await resolveServerLocale();
  setRequestLocale(locale);
  const messages = await getMessages();

  const isAdmin = session.user.roles?.includes('ADMIN') ?? false;

  return (
    <NextIntlClientProvider messages={messages}>
      <div className='relative min-h-screen overflow-hidden bg-background'>
        {/* Ambient Background */}
        <div className='pointer-events-none absolute inset-0'>
          <div className='absolute -left-28 top-10 size-72 rounded-full bg-primary/10 blur-3xl' />
          <div className='absolute -right-20 bottom-8 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
          <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-secondary/40' />
        </div>

        {/* Content */}
        <div className='relative z-10'>
          <AppHeader
            userName={session.user.name ?? null}
            userImage={session.user.image ?? null}
            isAdmin={isAdmin}
            locale={locale}
          />
          {children}
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
