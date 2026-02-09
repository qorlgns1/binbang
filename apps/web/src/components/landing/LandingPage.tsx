import dynamic from 'next/dynamic';

import type { LandingCopy, Lang } from '@/lib/i18n/landing';

import { Header } from './Header';
import { Hero } from './Hero';

const LandingTracker = dynamic(() => import('./LandingTracker').then((mod) => ({ default: mod.LandingTracker })));
const Features = dynamic(() => import('./Features').then((mod) => ({ default: mod.Features })));
const Footer = dynamic(() => import('./Footer').then((mod) => ({ default: mod.Footer })));

interface LandingPageProps {
  lang: Lang;
  copy: LandingCopy;
}

export function LandingPage({ lang, copy }: LandingPageProps): React.ReactElement {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <LandingTracker lang={lang} />
      <Header
        lang={lang}
        copy={copy}
      />
      <main>
        <Hero
          copy={copy}
          lang={lang}
        />
        <Features copy={copy} />
        <Footer
          copy={copy}
          lang={lang}
        />
      </main>
    </div>
  );
}
