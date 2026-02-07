import Image from 'next/image';
import Link from 'next/link';

import { ArrowRight, BellRing } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { LandingCopy } from './landing-data';
import { StatusDashboard } from './StatusDashboard';

interface HeroProps {
  copy: LandingCopy;
  lang: 'ko' | 'en';
}

export function Hero({ copy, lang }: HeroProps): React.ReactElement {
  return (
    <section className='relative flex min-h-screen flex-col justify-center overflow-hidden px-4 pb-20 pt-28'>
      <div className='absolute inset-0'>
        <Image
          src='https://images.unsplash.com/photo-1610029795220-e5afca4dc7ba?auto=format&fit=crop&w=1920&q=80'
          alt=''
          fill
          priority
          className='object-cover opacity-60'
          sizes='100vw'
        />
        <div className='absolute inset-0 bg-linear-to-b from-background/90 via-background/70 to-background' />
        <div className='absolute inset-0 bg-linear-to-r from-background/90 via-transparent to-background/90' />
      </div>

      <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center text-center'>
        <div className='mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs tracking-wide text-primary'>
          <span className='size-2 rounded-full bg-primary animate-pulse' />
          {copy.hero.statusLabel}
        </div>

        <h1 className='max-w-5xl text-4xl font-semibold leading-tight text-foreground md:text-6xl lg:text-7xl'>
          {copy.hero.headline}
          <br className='hidden md:block' />
          <span className='bg-linear-to-r from-primary/70 via-primary to-primary/80 bg-clip-text text-transparent'>
            {copy.hero.subheadline}
          </span>
        </h1>

        <p className='mt-7 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-xl'>{copy.hero.description}</p>

        <div className='mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center'>
          <Button
            asChild
            size='lg'
            className='bg-primary text-primary-foreground hover:bg-primary/90'
          >
            <Link href='/signup'>
              <BellRing className='mr-2 size-5' />
              {copy.hero.cta}
            </Link>
          </Button>
          <Button
            asChild
            size='lg'
            variant='outline'
            className='border-border bg-card/60 text-foreground hover:bg-accent'
          >
            <a href='#features'>
              {copy.hero.secondaryCta}
              <ArrowRight className='ml-2 size-4' />
            </a>
          </Button>
        </div>

        <div className='mt-16 w-full'>
          <StatusDashboard
            lang={lang}
            copy={copy}
          />
        </div>
      </div>
    </section>
  );
}
