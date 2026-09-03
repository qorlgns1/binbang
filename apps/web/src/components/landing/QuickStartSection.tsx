'use client';

import { useTranslations } from 'next-intl';

import { AlertQuickStart } from './AlertQuickStart';

/**
 * 홈 최상단 히어로.
 *
 * 랜딩 카피 대신 알림 등록 폼을 먼저 보여준다.
 * 이 섹션이 페이지의 h1을 갖고, 아래 Hero는 보조 설명으로 이어진다.
 */
export function QuickStartSection(): React.ReactElement {
  const t = useTranslations('landing.quickStart');

  return (
    <section id='start' className='px-4 pb-20 pt-20 sm:pt-24'>
      <div className='mx-auto w-full max-w-2xl space-y-8'>
        <div className='space-y-4 text-center'>
          {/* 문구에 넣은 \n 을 줄바꿈으로 렌더한다. 한글은 text-balance 가 잘 듣지 않아
              어절 중간("방 나 / 면")에서 끊기는 문제가 있었다. */}
          <h1 className='whitespace-pre-line break-keep text-4xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-[1.15]'>
            {t('title')}
          </h1>
          <p className='mx-auto max-w-md break-keep text-base text-muted-foreground sm:text-lg'>{t('subtitle')}</p>
        </div>

        <AlertQuickStart />
      </div>
    </section>
  );
}
