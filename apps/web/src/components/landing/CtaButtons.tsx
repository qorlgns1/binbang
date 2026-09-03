'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { ArrowRight, BellRing } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { trackPrimaryCTAClicked, trackSecondaryCTAClicked } from '@/lib/analytics/landingTracker';
import { smoothScrollTo } from '@/lib/utils/scroll';

/**
 * Render the primary and secondary call-to-action buttons used on the landing page.
 *
 * 주 CTA는 상단 검색 폼(#start)으로 스크롤한다. 회원가입을 없앤 뒤로 로그인 화면은
 * 신규 방문자가 갈 곳이 아니며, 실제 첫 행동은 숙소 검색이다.
 * 보조 CTA는 기능 섹션으로 스크롤한다.
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

  const handlePrimaryCTA = (e: React.MouseEvent): void => {
    e.preventDefault();
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    trackPrimaryCTAClicked(lang, theme);
    smoothScrollTo('start');
  };

  return (
    <div className='mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center'>
      <Button
        size='lg'
        className='landing-primary-cta bg-primary text-primary-foreground hover:bg-primary/90'
        onClick={handlePrimaryCTA}
      >
        <BellRing className='mr-2 size-5' />
        {t('hero.cta')}
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
