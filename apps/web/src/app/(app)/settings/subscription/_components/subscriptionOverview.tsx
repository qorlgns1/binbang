'use client';

import { useUserSubscription } from '@/hooks/useUserSubscription';

import { BillingCard } from './billingCard';
import { CurrentPlanCard } from './currentPlanCard';
import { UsageCard } from './usageCard';

export function SubscriptionOverview(): React.ReactElement {
  const { data, isLoading, isError } = useUserSubscription();

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-semibold text-foreground'>구독 정보</h2>
        <p className='text-muted-foreground mt-1'>필요한 만큼만, 편안하게 이용하세요</p>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <CurrentPlanCard plan={data?.plan ?? null} isLoading={isLoading} isError={isError} />
        <UsageCard quotas={data?.quotas ?? null} usage={data?.usage ?? null} isLoading={isLoading} isError={isError} />
      </div>

      {data?.subscription && <BillingCard subscription={data.subscription} isLoading={isLoading} />}
    </div>
  );
}
