import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { Zap, Anchor, Target } from 'lucide-react';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: 'about' });
  const { canonical, languages } = buildPublicAlternates(lang as Locale, '/about');
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

const STEPS = [
  { key: 'step1' as const, number: '1' },
  { key: 'step2' as const, number: '2' },
  { key: 'step3' as const, number: '3' },
] as const;

const VALUES = [
  { key: 'v1' as const, icon: Zap },
  { key: 'v2' as const, icon: Anchor },
  { key: 'v3' as const, icon: Target },
] as const;

export default async function AboutPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'about' });

  return (
    <main className='py-16'>
      {/* Header */}
      <div className='mb-20 text-center'>
        <h1 className='mb-4 text-3xl font-semibold text-foreground md:text-4xl'>{t('title.heading')}</h1>
        <p className='mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground'>{t('title.subline')}</p>
      </div>

      {/* Mission */}
      <section className='mx-auto mb-20 max-w-3xl px-4'>
        <div className='rounded-2xl border border-border/80 bg-card/90 p-8 shadow-sm backdrop-blur md:p-10'>
          <h2 className='mb-4 text-2xl font-semibold text-foreground'>{t('mission.title')}</h2>
          <p className='text-base leading-relaxed text-muted-foreground'>{t('mission.description')}</p>
        </div>
      </section>

      {/* How It Works */}
      <section className='mx-auto mb-20 max-w-3xl px-4'>
        <h2 className='mb-8 text-center text-2xl font-semibold text-foreground'>{t('howItWorks.title')}</h2>
        <div className='space-y-4'>
          {STEPS.map(({ key, number }) => (
            <div
              key={key}
              className='flex gap-5 rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'
            >
              <div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground'>
                {number}
              </div>
              <div>
                <h3 className='mb-1 font-medium text-foreground'>{t(`howItWorks.${key}Title`)}</h3>
                <p className='text-sm leading-relaxed text-muted-foreground'>{t(`howItWorks.${key}Desc`)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Values */}
      <section className='mx-auto mb-20 max-w-3xl px-4'>
        <h2 className='mb-8 text-center text-2xl font-semibold text-foreground'>{t('values.title')}</h2>
        <div className='grid gap-4 md:grid-cols-3'>
          {VALUES.map(({ key, icon: Icon }) => (
            <div
              key={key}
              className='rounded-lg border border-border/80 bg-card/90 p-5 text-center shadow-sm backdrop-blur'
            >
              <div className='mx-auto mb-3 flex size-12 items-center justify-center rounded-lg border border-border bg-background/70'>
                <Icon className='size-6 text-primary' />
              </div>
              <h3 className='mb-2 font-medium text-foreground'>{t(`values.${key}Title`)}</h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>{t(`values.${key}Desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className='mx-auto max-w-3xl border-t border-border/50 px-4 pt-12 text-center'>
        <h2 className='mb-3 text-2xl font-semibold text-foreground'>{t('cta.title')}</h2>
        <p className='mx-auto mb-8 max-w-xl text-muted-foreground'>{t('cta.description')}</p>
        <Link
          href={`/${lang}/signup`}
          className='inline-block rounded-full border border-primary/40 bg-card px-7 py-3 font-semibold text-primary transition-colors hover:bg-accent'
        >
          {t('cta.button')}
        </Link>
      </section>
    </main>
  );
}
