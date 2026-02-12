import Image from 'next/image';
import Link from 'next/link';

import type { LandingCopy, Lang } from '@/lib/i18n/landing';

import { CTAButtons } from './CTAButtons';
import { StatusDashboardSlot } from './StatusDashboardSlot';

interface HeroProps {
  copy: LandingCopy;
  lang: Lang;
}

/**
 * Renders the landing-page hero section with background imagery, headline, description, CTAs, and status dashboard.
 *
 * @param copy - Localized copy for the hero (headlines, subheadlines, description, and status label)
 * @param lang - Current language/locale used for child components and CTA behavior
 * @returns A React element representing the landing hero section
 */
export function Hero({ copy, lang }: HeroProps): React.ReactElement {
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
          {copy.hero.statusLabel}
        </div>

        <h1 className='max-w-5xl text-[32px] font-bold leading-[48px] text-foreground md:text-[56px] md:leading-[64px] lg:text-[72px] lg:leading-[80px]'>
          {/* Mobile: 각 줄마다 줄바꿈 */}
          <span className='md:hidden'>
            {copy.hero.headlineMobile.map((line, i) => (
              <span key={line}>
                {line}
                {i < copy.hero.headlineMobile.length - 1 && <br />}
              </span>
            ))}
            <span className='bg-linear-to-r from-primary/70 via-primary to-primary/80 bg-clip-text text-transparent'>
              <br />
              {copy.hero.subheadlineMobile.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < copy.hero.subheadlineMobile.length - 1 && <br />}
                </span>
              ))}
            </span>
          </span>
          {/* Desktop: 한 줄로 표시 */}
          <span className='hidden md:inline'>
            {copy.hero.headline}
            <br />
            <span className='bg-linear-to-r from-primary/70 via-primary to-primary/80 bg-clip-text text-transparent'>
              {copy.hero.subheadline}
            </span>
          </span>
        </h1>

        <p className='mt-7 max-w-3xl text-base leading-[26px] text-muted-foreground'>{copy.hero.description}</p>

        <p className='mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground'>
          {copy.hero.aboutApp}{' '}
          <Link href='/privacy' className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'>
            {copy.footer.privacy}
          </Link>
        </p>

        <CTAButtons copy={copy} lang={lang} />

        <div className='mt-16 w-full'>
          <StatusDashboardSlot copy={copy} lang={lang} />
        </div>
      </div>
    </section>
  );
}
