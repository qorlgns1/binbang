'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { ArrowRight, BellRing } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trackPrimaryCTAClicked, trackSecondaryCTAClicked } from '@/lib/analytics/landingTracker';
import { smoothScrollTo } from '@/lib/utils/scroll';

/**
 * Render the primary and secondary call-to-action buttons used on the landing page.
 * The primary button navigates to signup; the secondary button smooth-scrolls to the features section.
 */
export function CTAButtons(): React.ReactElement {
  const t = useTranslations('landing');
  const lang = useParams().lang as string;

  const handleSecondaryCTA = (e: React.MouseEvent): void => {
    e.preventDefault();
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    trackSecondaryCTAClicked(lang, theme);
    smoothScrollTo('features');
  };

  const handlePrimaryCTA = (): void => {
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    trackPrimaryCTAClicked(lang, theme);
  };

  return (
    <div className='mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center'>
      <Button asChild size='lg' className='landing-primary-cta bg-primary text-primary-foreground hover:bg-primary/90'>
        <Link href={`/${lang}/signup`} onClick={handlePrimaryCTA}>
          <BellRing className='mr-2 size-5' />
          {t('hero.cta')}
        </Link>
      </Button>
      <Button
        size='lg'
        variant='outline'
        className='landing-secondary-cta border-border bg-card/60 text-foreground hover:border-primary/60 hover:bg-accent'
        onClick={handleSecondaryCTA}
      >
        {t('hero.secondaryCta')}
        <ArrowRight className='ml-2 size-4' />
      </Button>
    </div>
  );
}
