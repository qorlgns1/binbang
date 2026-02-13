import dynamic from 'next/dynamic';

import type { LandingCopy, Lang } from '@/lib/i18n/landing';

import { AppPurpose } from './AppPurpose';
import { Hero } from './Hero';

const LandingTracker = dynamic(() => import('./LandingTracker').then((mod) => ({ default: mod.LandingTracker })));
const Features = dynamic(() => import('./Features').then((mod) => ({ default: mod.Features })));
const Footer = dynamic(() => import('./Footer').then((mod) => ({ default: mod.Footer })));

interface LandingPageProps {
  lang: Lang;
  copy: LandingCopy;
}

/**
 * Render the landing page composed of header, hero, features, footer, and tracker for the provided language and copy.
 *
 * @param lang - Language identifier used to localize content and analytics
 * @param copy - Localized text and content passed to child components
 * @returns A React element representing the composed landing page for the given `lang` and `copy`
 */
export function LandingPage({ lang, copy }: LandingPageProps): React.ReactElement {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <LandingTracker lang={lang} />
      <main>
        <Hero copy={copy} lang={lang} />
        <AppPurpose copy={copy} lang={lang} />
        <Features copy={copy} />
        <Footer copy={copy} lang={lang} />
      </main>
    </div>
  );
}
