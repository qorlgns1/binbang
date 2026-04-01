'use client';

import { useUserSubscription } from '@/hooks/useUserSubscription';

import { CurrentPlanCard } from './CurrentPlanCard';
import { UsageCard } from './UsageCard';

export function SubscriptionOverview(): React.ReactElement {
  const { data, isLoading, isError } = useUserSubscription();

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold text-foreground'>베타 이용 정보</h2>
        <p className='mt-1 text-muted-foreground'>가격보다 현재 사용량과 제공 범위를 먼저 안내합니다.</p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <CurrentPlanCard plan={data?.plan ?? null} isLoading={isLoading} isError={isError} />
        <UsageCard quotas={data?.quotas ?? null} usage={data?.usage ?? null} isLoading={isLoading} isError={isError} />
      </div>

      <div className='rounded-2xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur'>
        <div className='text-[11px] font-semibold uppercase tracking-[1.4px] text-muted-foreground'>Open Beta</div>
        <h3 className='mt-2 text-lg font-semibold text-foreground'>베타 운영 안내</h3>
        <div className='mt-3 space-y-2 text-sm leading-7 text-muted-foreground'>
          <p>현재는 공개 요금제나 자동 결제보다 실제 알림 품질과 운영 안정성을 먼저 다듬고 있습니다.</p>
          <p>이 페이지는 결제 정보보다 사용량과 제공 범위를 중심으로 유지합니다.</p>
        </div>
      </div>
    </div>
  );
}
