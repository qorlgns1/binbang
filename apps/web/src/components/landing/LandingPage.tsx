import dynamic from 'next/dynamic';

import type { Locale } from '@workspace/shared/i18n';

import { AppPurpose } from './AppPurpose';
import { Hero } from './Hero';

const LandingTracker = dynamic(() => import('./LandingTracker').then((mod) => ({ default: mod.LandingTracker })));
const Features = dynamic(() => import('./Features').then((mod) => ({ default: mod.Features })));
const Footer = dynamic(() => import('./Footer').then((mod) => ({ default: mod.Footer })));

interface LandingPageProps {
  lang: Locale;
}

/**
 * Render the landing page composed of header, hero, features, footer, and tracker.
 * Localized copy is provided by next-intl (useTranslations('landing') in child components).
 */
export function LandingPage({ lang }: LandingPageProps): React.ReactElement {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <LandingTracker lang={lang} />
      <main>
        <Hero />
        <AppPurpose />
        <Features />
        <Footer />
      </main>
    </div>
  );
}
