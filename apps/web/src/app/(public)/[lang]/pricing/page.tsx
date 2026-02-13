import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { LangToggle } from '@/components/landing/LangToggle';
import { isValidLang } from '@/lib/i18n/landing';

import { PricingCards } from './_components/pricingCards';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { lang } = await params;
  if (!isValidLang(lang)) return {};
  const t = await getTranslations({ locale: lang, namespace: 'pricing' });
  return {
    title: t('nav.brand') + ' – Pricing',
    description:
      'View Binbang plans. Start free, upgrade anytime. 1-min checks, real-time KakaoTalk alerts, price trend analysis.',
    openGraph: {
      title: t('nav.brand') + ' – Pricing',
      description: 'Start free. 1-min checks, real-time alerts.',
      url: '/pricing',
    },
  };
}

export default async function PricingPage({ params }: PageProps): Promise<React.ReactElement> {
  const { lang } = await params;
  if (!isValidLang(lang)) notFound();

  const t = await getTranslations({ locale: lang, namespace: 'pricing' });
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;

  return (
    <div className='relative min-h-screen overflow-hidden bg-background'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-28 top-10 size-72 rounded-full bg-primary/10 blur-3xl' />
        <div className='absolute -right-20 bottom-8 size-80 rounded-full bg-brand-navy/10 blur-3xl' />
        <div className='absolute inset-0 bg-linear-to-b from-transparent via-transparent to-secondary/40' />
      </div>

      <div className='relative z-10'>
        <header className='border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40'>
          <div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
            <div className='flex items-center gap-4'>
              <Button variant='ghost' size='icon' asChild>
                <Link href={isLoggedIn ? '/dashboard' : `/${lang}`}>
                  <ArrowLeft className='size-5' />
                </Link>
              </Button>
              <Link href={`/${lang}`} className='flex items-center gap-2'>
                <span className='flex size-8 items-center justify-center rounded-full bg-primary'>
                  <span className='size-2 rounded-full bg-primary-foreground animate-ping' />
                </span>
                <span className='text-sm font-semibold tracking-wide text-foreground md:text-base'>
                  {t('nav.brand')}
                </span>
              </Link>
            </div>
            <div className='flex items-center gap-2'>
              <LangToggle currentLang={lang} />
              {isLoggedIn ? (
                <>
                  <span className='text-sm text-muted-foreground'>{session.user.name}</span>
                  <Button asChild className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    <Link href='/dashboard'>{t('nav.dashboard')}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant='outline' asChild>
                    <Link href={`/${lang}/login`}>{t('nav.login')}</Link>
                  </Button>
                  <Button asChild className='bg-primary text-primary-foreground hover:bg-primary/90'>
                    <Link href={`/${lang}/signup`}>{t('nav.getStarted')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

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
            <p>{t('footer.contact')}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
