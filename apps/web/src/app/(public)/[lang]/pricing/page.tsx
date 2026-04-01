import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ArrowRight, Clock3, Mail, MessageSquareHeart, ShieldCheck, Sparkles, Users } from 'lucide-react';

import { type Locale, isSupportedLocale } from '@workspace/shared/i18n';
import { buildPublicAlternates, DEFAULT_OG_IMAGE, getOgLocale } from '@/lib/i18n-runtime/seo';
import { SUPPORT_EMAIL } from '@/lib/support';
import { Button } from '@/components/ui/button';
import { buildPublicPath } from '@/lib/i18n-runtime/publicPath';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: 'pricing' });
  const { canonical, languages } = buildPublicAlternates(lang as Locale, '/pricing');
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

export default async function PricingPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'pricing' });
  const highlightCards = [
    {
      key: 'beta',
      icon: Sparkles,
    },
    {
      key: 'coverage',
      icon: ShieldCheck,
    },
    {
      key: 'feedback',
      icon: MessageSquareHeart,
    },
  ] as const;
  const processSteps = [
    {
      key: 'step1',
      icon: Users,
    },
    {
      key: 'step2',
      icon: Clock3,
    },
    {
      key: 'step3',
      icon: Mail,
    },
  ] as const;

  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-20 bottom-8 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-secondary/40' />
      </div>

      <div className='relative z-10'>
        <main className='py-16'>
          <div className='mx-auto mb-16 max-w-3xl px-4 text-center'>
            <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium tracking-wide text-primary'>
              <span className='size-2 rounded-full bg-primary animate-pulse' />
              {t('hero.eyebrow')}
            </div>
            <h1 className='mb-4 text-3xl font-semibold tracking-tight text-foreground md:text-5xl'>
              {t('hero.heading')}
            </h1>
            <p className='mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground'>
              {t('hero.subline1')}
              <br className='hidden sm:block' />
              <span className='sm:ml-1'>{t('hero.subline2')}</span>
            </p>
            <p className='mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground'>{t('hero.description')}</p>
          </div>

          <div className='mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3'>
            {highlightCards.map(({ key, icon: Icon }) => (
              <section key={key} className='rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur'>
                <div className='mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                  <Icon className='size-5' />
                </div>
                <h2 className='text-xl font-semibold text-foreground'>{t(`cards.${key}.title`)}</h2>
                <p className='mt-3 text-sm leading-7 text-muted-foreground'>{t(`cards.${key}.description`)}</p>
              </section>
            ))}
          </div>

          <div className='mx-auto mt-20 max-w-5xl px-4'>
            <div className='rounded-3xl border border-border/80 bg-card/85 p-7 shadow-sm backdrop-blur md:p-10'>
              <h2 className='text-2xl font-semibold text-foreground'>{t('process.title')}</h2>
              <div className='mt-8 grid gap-5 md:grid-cols-3'>
                {processSteps.map(({ key, icon: Icon }, index) => (
                  <article key={key} className='rounded-2xl border border-border/70 bg-background/70 p-5'>
                    <div className='flex items-center gap-3'>
                      <div className='flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground'>
                        {index + 1}
                      </div>
                      <Icon className='size-5 text-primary' />
                    </div>
                    <h3 className='mt-4 text-lg font-semibold text-foreground'>{t(`process.${key}.title`)}</h3>
                    <p className='mt-2 text-sm leading-7 text-muted-foreground'>{t(`process.${key}.description`)}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className='mx-auto mt-20 max-w-3xl px-4'>
            <div className='rounded-3xl border border-primary/20 bg-primary/5 p-7 text-center'>
              <h2 className='text-2xl font-semibold text-foreground'>{t('cta.title')}</h2>
              <p className='mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground'>{t('cta.description')}</p>
              <div className='mt-6 flex flex-col justify-center gap-3 sm:flex-row'>
                <Button asChild size='lg' className='bg-primary text-primary-foreground hover:bg-primary/90'>
                  <Link href={buildPublicPath(lang, '/signup')}>
                    {t('cta.primary')}
                    <ArrowRight className='ml-2 size-4' />
                  </Link>
                </Button>
                <Button asChild size='lg' variant='outline'>
                  <Link href={`mailto:${SUPPORT_EMAIL}`}>{t('cta.secondary')}</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className='mx-auto mt-20 max-w-2xl px-4'>
            <h2 className='mb-8 text-center text-2xl font-semibold text-foreground'>{t('faq.title')}</h2>
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
