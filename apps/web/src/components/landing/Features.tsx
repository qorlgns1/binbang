'use client';

import { BellOff, Timer, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * 처음 온 방문자가 실제로 궁금해하는 것만 사실대로 적는다.
 *
 * 각 항목은 코드에 근거가 있다:
 * - 30분 주기: `binbang-runtime-settings.service.ts` 의 `pollIntervalMinutes` 기본값
 * - 무료 / 알림 5개: `packages/db` seed 상수의 FREE 플랜과 `MAX_ACCOMMODATIONS`
 * - 수신거부: 알림 메일 하단에 서명 토큰 링크를 넣는다 (`agoda-notification.service.ts`)
 */
export function Features(): React.ReactElement {
  const t = useTranslations('landing');

  const items = [
    { icon: Timer, title: t('features.f1Title'), description: t('features.f1Desc') },
    { icon: Wallet, title: t('features.f2Title'), description: t('features.f2Desc') },
    { icon: BellOff, title: t('features.f3Title'), description: t('features.f3Desc') },
  ];

  return (
    <section id='features' className='bg-background px-4 py-20'>
      <div className='mx-auto grid w-full max-w-5xl gap-5 sm:grid-cols-3'>
        {items.map(({ icon: Icon, title, description }) => (
          <article key={title} className='rounded-2xl border border-border bg-card/50 p-6'>
            <div className='mb-4 w-fit rounded-lg border border-border bg-background/70 p-2.5'>
              <Icon className='size-5 text-primary' />
            </div>
            <h3 className='break-keep text-lg font-semibold text-foreground'>{title}</h3>
            <p className='mt-2 break-keep text-sm leading-relaxed text-muted-foreground'>{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
