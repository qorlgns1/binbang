import dynamic from 'next/dynamic';

import type { Locale } from '@workspace/shared/i18n';

import { QuickStartSection } from './QuickStartSection';

const LandingTracker = dynamic(() => import('./LandingTracker').then((mod) => ({ default: mod.LandingTracker })));
const Hero = dynamic(() => import('./Hero').then((mod) => ({ default: mod.Hero })));
const Features = dynamic(() => import('./Features').then((mod) => ({ default: mod.Features })));
const Footer = dynamic(() => import('./Footer').then((mod) => ({ default: mod.Footer })));

interface LandingPageProps {
  lang: Locale;
}

/**
 * Render the home page: 알림 등록 검색창을 먼저 두고, 기존 랜딩 콘텐츠를 그 아래에 이어 붙인다.
 * Localized copy is provided by next-intl (useTranslations('landing') in child components).
 */
export function LandingPage({ lang }: LandingPageProps): React.ReactElement {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <LandingTracker lang={lang} />
      <main>
        <QuickStartSection />
        <Hero />
        <Features />
        <Footer />
      </main>
    </div>
  );
}
