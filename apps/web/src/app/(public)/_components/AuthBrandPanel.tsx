'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ShieldCheck, Timer, WavesLadder } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuthBrandPanelProps {
  ctaLabel?: string;
  ctaHref?: string;
}

export function AuthBrandPanel({ ctaLabel, ctaHref }: AuthBrandPanelProps): React.ReactElement {
  const t = useTranslations('auth');

  return (
    <aside className='relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-7 shadow-sm'>
      <div className='pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent' />

      <div className='relative z-10 flex h-full flex-col justify-center space-y-5'>
        <Badge className='border-primary/40 bg-primary/10 text-primary'>{t('panel.badge')}</Badge>

        <div>
          <p className='text-sm text-muted-foreground'>{t('panel.brand')}</p>
          <h2 className='mt-2 text-2xl font-semibold leading-tight text-foreground md:text-3xl'>
            {t('panel.headline1')}
            <br />
            {t('panel.headline2')}
          </h2>
          <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>{t('panel.description')}</p>
        </div>

        <ul className='space-y-3 text-sm text-muted-foreground'>
          <li className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary'>
              <Timer className='size-4' />
            </span>
            <span>{t('panel.bullet1')}</span>
          </li>
          <li className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary'>
              <WavesLadder className='size-4' />
            </span>
            <span>{t('panel.bullet2')}</span>
          </li>
          <li className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary'>
              <ShieldCheck className='size-4' />
            </span>
            <span>{t('panel.bullet3')}</span>
          </li>
        </ul>

        {ctaLabel && ctaHref ? (
          <Button
            asChild
            variant='outline'
            className='border-primary/40 bg-background/70 text-primary hover:bg-primary/10'
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
