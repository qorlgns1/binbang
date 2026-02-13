import type { ReactNode } from 'react';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PublicHeader } from '@/app/(public)/_components/PublicHeader';
import { isValidLang, supportedLangs, type Lang } from '@/lib/i18n/landing';

export function generateStaticParams() {
  return supportedLangs.map((lang) => ({ lang }));
}

interface LangLayoutProps {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  setRequestLocale(lang);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <PublicHeader lang={lang as Lang} />
      {children}
    </NextIntlClientProvider>
  );
}
