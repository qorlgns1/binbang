'use client';

import Link from 'next/link';

import { ArrowRight, BellRing } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trackPrimaryCTAClicked, trackSecondaryCTAClicked } from '@/lib/analytics/landing-tracker';
import type { LandingCopy, Lang } from '@/lib/i18n/landing';
import { smoothScrollTo } from '@/lib/utils/scroll';

interface CTAButtonsProps {
  copy: LandingCopy;
  lang: Lang;
}

/**
 * Render the primary and secondary call-to-action buttons used on the landing page.
 *
 * The primary button navigates users to the signup page and records a primary-CTA analytics event.
 * The secondary button records a secondary-CTA analytics event and smooth-scrolls to the "features" section.
 *
 * @param copy - Localized copy/content for the CTA texts (from `LandingCopy`)
 * @param lang - Language code used when reporting analytics (from `Lang`)
 * @returns A React element containing the two CTA buttons (primary: signup link; secondary: scrolls to features)
 */
export function CTAButtons({ copy, lang }: CTAButtonsProps): React.ReactElement {
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
      <Button
        asChild
        size='lg'
        className='landing-primary-cta bg-primary text-primary-foreground hover:bg-primary/90'
      >
        <Link
          href='/signup'
          onClick={handlePrimaryCTA}
        >
          <BellRing className='mr-2 size-5' />
          {copy.hero.cta}
        </Link>
      </Button>
      <Button
        size='lg'
        variant='outline'
        className='landing-secondary-cta border-border bg-card/60 text-foreground hover:border-primary/60 hover:bg-accent'
        onClick={handleSecondaryCTA}
      >
        {copy.hero.secondaryCta}
        <ArrowRight className='ml-2 size-4' />
      </Button>
    </div>
  );
}
