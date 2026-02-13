import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';
import { SUPPORT_EMAIL } from '@/lib/support';

import { PricingCards } from './_components/pricingCards';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: 'pricing' });
  const { canonical, languages } = buildPublicAlternates(lang as Locale, '/pricing');
  return {
    title: `${t('nav.brand')} – Pricing`,
    description: t('meta.description'),
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      locale: getOgLocale(lang as Locale),
      url: canonical,
      siteName: 'Binbang',
      title: `${t('nav.brand')} – Pricing`,
      description: t('meta.ogDescription'),
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function PricingPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'pricing' });

  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-20 bottom-8 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-secondary/40' />
      </div>

      <div className='relative z-10'>
        <main className='py-16'>
          <div className='mb-16 text-center'>
            <h2 className='mb-4 text-3xl font-semibold text-foreground md:text-4xl'>{t('title.heading')}</h2>
            <p className='mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground'>
              {t('title.subline1')}
              <br />
              {t('title.subline2')}
            </p>
          </div>

          <PricingCards />

          <div className='mx-auto mt-20 max-w-2xl px-4'>
            <h3 className='mb-8 text-center text-2xl font-semibold text-foreground'>{t('faq.title')}</h3>
            <div className='space-y-4'>
              <div className='rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'>
                <h4 className='mb-2 font-medium text-foreground'>{t('faq.q1')}</h4>
                <p className='text-sm leading-relaxed text-muted-foreground'>{t('faq.a1')}</p>
              </div>
              <div className='rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'>
                <h4 className='mb-2 font-medium text-foreground'>{t('faq.q2')}</h4>
                <p className='text-sm leading-relaxed text-muted-foreground'>{t('faq.a2')}</p>
              </div>
              <div className='rounded-lg border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'>
                <h4 className='mb-2 font-medium text-foreground'>{t('faq.q3')}</h4>
                <p className='text-sm leading-relaxed text-muted-foreground'>{t('faq.a3')}</p>
              </div>
            </div>
          </div>
        </main>

        <footer className='border-t border-border/50 bg-background/80 py-8 backdrop-blur'>
          <div className='mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground'>
            <p>{t('footer.contact', { email: SUPPORT_EMAIL })}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
