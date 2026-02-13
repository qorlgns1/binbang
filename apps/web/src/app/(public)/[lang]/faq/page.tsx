import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { HelpCircle, Bell, UserCircle, MessageCircle } from 'lucide-react';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';
import { SUPPORT_EMAIL } from '@/lib/support';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: 'faq' });
  const { canonical, languages } = buildPublicAlternates(lang as Locale, '/faq');
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      locale: getOgLocale(lang as Locale),
      url: canonical,
      siteName: 'Binbang',
      title: t('meta.title'),
      description: t('meta.ogDescription'),
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

const CATEGORIES = [
  { key: 'service', icon: HelpCircle, questionCount: 2 },
  { key: 'monitoring', icon: Bell, questionCount: 3 },
  { key: 'account', icon: UserCircle, questionCount: 3 },
  { key: 'other', icon: MessageCircle, questionCount: 2 },
] as const;

export default async function FaqPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'faq' });

  return (
    <main className='py-16'>
      <div className='mb-16 text-center'>
        <h1 className='mb-4 text-3xl font-semibold text-foreground md:text-4xl'>{t('title.heading')}</h1>
        <p className='mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground'>{t('title.subline')}</p>
      </div>

      <div className='mx-auto max-w-3xl px-4'>
        <div className='space-y-12'>
          {CATEGORIES.map(({ key, icon: Icon, questionCount }) => (
            <section key={key}>
              <div className='mb-5 flex items-center gap-3'>
                <div className='flex size-9 items-center justify-center rounded-lg border border-border bg-background/70'>
                  <Icon className='size-5 text-primary' />
                </div>
                <h2 className='text-xl font-semibold text-foreground'>{t(`categories.${key}`)}</h2>
              </div>
              <div className='space-y-4'>
                {Array.from({ length: questionCount }, (_, i) => (
                  <div
                    key={`${key}-q${i + 1}`}
                    className='rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'
                  >
                    <h3 className='mb-2 font-medium text-foreground'>{t(`${key}.q${i + 1}`)}</h3>
                    <p className='text-sm leading-relaxed text-muted-foreground'>{t(`${key}.a${i + 1}`)}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <footer className='mx-auto mt-20 max-w-3xl border-t border-border/50 px-4 pt-8 text-center'>
        <p className='text-sm text-muted-foreground'>
          {t('other.a2').includes(SUPPORT_EMAIL) ? (
            t('title.subline')
          ) : (
            <>
              {lang === 'ko' ? '더 궁금한 점이 있으신가요? ' : 'Still have questions? '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
              >
                {SUPPORT_EMAIL}
              </a>
            </>
          )}
        </p>
        <div className='mt-4 flex justify-center gap-4 text-sm'>
          <Link
            href={`/${lang}/privacy`}
            className='text-muted-foreground underline underline-offset-4 hover:text-foreground'
          >
            {lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
          </Link>
          <Link
            href={`/${lang}/pricing`}
            className='text-muted-foreground underline underline-offset-4 hover:text-foreground'
          >
            {lang === 'ko' ? '요금제' : 'Pricing'}
          </Link>
        </div>
      </footer>
    </main>
  );
}
