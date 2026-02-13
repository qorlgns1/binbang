'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMessages, useTranslations } from 'next-intl';

import { CTAButtons } from './CTAButtons';
import { StatusDashboardSlot } from './StatusDashboardSlot';

/**
 * Renders the landing-page hero section with background imagery, headline, description, CTAs, and status dashboard.
 */
export function Hero(): React.ReactElement {
  const t = useTranslations('landing');
  const messages = useMessages();
  const lang = useParams().lang as string;
  const headlineMobile = (messages.landing as { hero?: { headlineMobile?: string[] } })?.hero?.headlineMobile ?? [];
  const subheadlineMobile =
    (messages.landing as { hero?: { subheadlineMobile?: string[] } })?.hero?.subheadlineMobile ?? [];

  return (
    <section className='relative flex min-h-screen flex-col justify-center overflow-hidden px-4 pb-20 pt-28'>
      <div className='absolute inset-0'>
        <Image
          src='https://images.unsplash.com/photo-1610029795220-e5afca4dc7ba?auto=format&fit=crop&w=1920&q=80'
          alt='빈방 - 숙소 빈방 알림 서비스 - 밤바다를 비추는 등대'
          fill
          priority
          className='object-cover opacity-60'
          sizes='100vw'
        />
        <div className='absolute inset-0 bg-linear-to-b from-background/90 via-background/70 to-background' />
        <div className='absolute inset-0 bg-linear-to-r from-background/90 via-transparent to-background/90' />
      </div>

      <div className='landing-hero-entrance relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center text-center'>
        <div className='mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs tracking-wide text-primary'>
          <span className='size-2 rounded-full bg-primary animate-pulse' />
          {t('hero.statusLabel')}
        </div>

        <h1 className='max-w-5xl text-[32px] font-bold leading-[48px] text-foreground md:text-[56px] md:leading-[64px] lg:text-[72px] lg:leading-[80px]'>
          <span className='md:hidden'>
            {headlineMobile.map((line, i) => (
              <span key={line}>
                {line}
                {i < headlineMobile.length - 1 && <br />}
              </span>
            ))}
            <span className='bg-linear-to-r from-primary/70 via-primary to-primary/80 bg-clip-text text-transparent'>
              <br />
              {subheadlineMobile.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < subheadlineMobile.length - 1 && <br />}
                </span>
              ))}
            </span>
          </span>
          <span className='hidden md:inline'>
            {t('hero.headline')}
            <br />
            <span className='bg-linear-to-r from-primary/70 via-primary to-primary/80 bg-clip-text text-transparent'>
              {t('hero.subheadline')}
            </span>
          </span>
        </h1>

        <p className='mt-7 max-w-3xl text-base leading-[26px] text-muted-foreground'>{t('hero.description')}</p>

        <p className='mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground'>
          {t('hero.aboutApp')}{' '}
          <Link
            href={`/${lang}/privacy`}
            className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
          >
            {t('footer.privacy')}
          </Link>
        </p>

        <CTAButtons />

        <div className='mt-16 w-full'>
          <StatusDashboardSlot />
        </div>
      </div>
    </section>
  );
}
