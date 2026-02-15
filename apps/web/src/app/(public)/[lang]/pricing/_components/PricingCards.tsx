'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Check, Clock, Home, Zap } from 'lucide-react';

import { SUPPORT_EMAIL } from '@/lib/support';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type PlanInfo, usePlans } from '@/hooks/usePlans';
import { useUserQuota } from '@/hooks/useUserQuota';

function PlanCard({
  plan,
  isCurrentPlan,
  lang,
}: {
  plan: PlanInfo;
  isCurrentPlan: boolean;
  lang: string;
}): React.ReactElement {
  const t = useTranslations('pricing');
  const isPopular = plan.name === 'PRO';

  const priceLabel = plan.price === 0 ? t('plan.free') : `₩${plan.price.toLocaleString()}`;
  const intervalLabel = plan.price > 0 ? (plan.interval === 'month' ? t('plan.perMonth') : t('plan.perYear')) : null;

  const planName =
    plan.name === 'FREE' || plan.name === 'PRO' || plan.name === 'BIZ' ? t(`plan.plans.${plan.name}.name`) : plan.name;
  const planDescription =
    plan.name === 'FREE' || plan.name === 'PRO' || plan.name === 'BIZ'
      ? t(`plan.plans.${plan.name}.description`)
      : (plan.description ?? '');

  return (
    <Card
      className={`relative flex flex-col gap-3 overflow-visible border-border/80 bg-card/90 shadow-sm backdrop-blur transition-all hover:shadow-md ${
        isPopular ? 'border-primary shadow-lg lg:scale-105' : ''
      } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
    >
      {isPopular && (
        <Badge className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground'>
          {t('plan.popular')}
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge className='absolute -top-3 right-4 bg-status-success text-status-success-foreground'>
          {t('plan.currentPlan')}
        </Badge>
      )}

      <CardHeader className='text-center pb-2'>
        <CardTitle className='text-xl'>{planName}</CardTitle>
        <CardDescription>{planDescription}</CardDescription>
      </CardHeader>

      <CardContent className='flex-1'>
        <div className='text-center mb-6'>
          <span className='text-4xl font-bold'>{priceLabel}</span>
          {intervalLabel != null && <span className='text-muted-foreground'>/{intervalLabel}</span>}
        </div>

        <ul className='space-y-3'>
          <li className='flex items-center gap-2'>
            <Home className='size-4 text-primary' />
            <span>{t('plan.accommodations', { count: plan.quotas.maxAccommodations })}</span>
          </li>
          <li className='flex items-center gap-2'>
            <Clock className='size-4 text-primary' />
            <span>{t('plan.checkInterval', { minutes: plan.quotas.checkIntervalMin })}</span>
          </li>
          <li className='flex items-center gap-2'>
            <Zap className='size-4 text-primary' />
            <span>{t('plan.kakaoAlert')}</span>
          </li>
          <li className='flex items-center gap-2'>
            <Check className='size-4 text-primary' />
            <span>{t('plan.priceChart')}</span>
          </li>
          {plan.name !== 'FREE' && (
            <li className='flex items-center gap-2'>
              <Check className='size-4 text-primary' />
              <span>{t('plan.prioritySupport')}</span>
            </li>
          )}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button className='w-full' variant='outline' disabled>
            {t('plan.currentPlanButton')}
          </Button>
        ) : plan.price === 0 ? (
          <Button className='w-full bg-primary text-primary-foreground hover:bg-primary/90' asChild>
            <Link href={`/${lang}/signup`}>{t('plan.getStartedFree')}</Link>
          </Button>
        ) : (
          <Button className='w-full bg-primary text-primary-foreground hover:bg-primary/90' asChild>
            <Link
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('plan.upgradeInquirySubject', { planName }))}`}
            >
              {t('plan.upgradeInquiry')}
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function PricingCardsSkeleton(): React.ReactElement {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto'>
      {[1, 2, 3].map((i) => (
        <Card key={i} className='flex flex-col'>
          <CardHeader className='text-center'>
            <Skeleton className='h-6 w-20 mx-auto' />
            <Skeleton className='h-4 w-32 mx-auto mt-2' />
          </CardHeader>
          <CardContent className='flex-1'>
            <Skeleton className='h-10 w-24 mx-auto mb-6' />
            <div className='space-y-3'>
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className='h-5 w-full' />
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className='h-10 w-full' />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export function PricingCards(): React.ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations('pricing');
  const { data: plans, isLoading, isError } = usePlans();
  const { data: userQuota } = useUserQuota();

  const currentPlanName = userQuota?.planName;

  if (isLoading) {
    return <PricingCardsSkeleton />;
  }

  if (isError || !plans) {
    return <div className='text-center text-muted-foreground py-12'>{t('loadError')}</div>;
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12 max-w-5xl mx-auto px-4 pt-4'>
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} isCurrentPlan={plan.name === currentPlanName} lang={lang} />
      ))}
    </div>
  );
}
