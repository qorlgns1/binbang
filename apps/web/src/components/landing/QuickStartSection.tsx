'use client';

import { useTranslations } from 'next-intl';

import { AlertQuickStart } from './AlertQuickStart';

/**
 * 홈 최상단 섹션.
 *
 * 랜딩 카피 대신 검색창을 먼저 보여준다.
 * 기존 랜딩 콘텐츠(Hero/Features/Footer)는 이 아래에 그대로 이어진다.
 */
export function QuickStartSection(): React.ReactElement {
  const t = useTranslations('landing.quickStart');

  return (
    <section className='px-4 pb-16 pt-24 sm:pt-28'>
      <div className='mx-auto w-full max-w-xl space-y-6'>
        <div className='space-y-3 text-center'>
          <h1 className='text-balance text-3xl font-semibold tracking-tight sm:text-4xl'>{t('title')}</h1>
          <p className='text-pretty text-muted-foreground'>{t('subtitle')}</p>
        </div>

        <AlertQuickStart />
      </div>
    </section>
  );
}
