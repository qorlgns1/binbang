'use client';

import Link from 'next/link';

import { Check, Clock, Home, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type PlanInfo, usePlans } from '@/hooks/usePlans';
import { useUserQuota } from '@/hooks/useUserQuota';

function formatPrice(price: number): string {
  if (price === 0) return '무료';
  return `₩${price.toLocaleString()}`;
}

function PlanCard({ plan, isCurrentPlan }: { plan: PlanInfo; isCurrentPlan: boolean }) {
  const isPopular = plan.name === 'PRO';

  return (
    <Card
      className={`relative flex flex-col overflow-visible gap-3 ${
        isPopular ? 'border-primary shadow-lg lg:scale-105' : ''
      } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
    >
      {isPopular && (
        <Badge className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground'>인기</Badge>
      )}
      {isCurrentPlan && (
        <Badge className='absolute -top-3 right-4 bg-status-success text-status-success-foreground'>현재 플랜</Badge>
      )}

      <CardHeader className='text-center pb-2'>
        <CardTitle className='text-xl'>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className='flex-1'>
        <div className='text-center mb-6'>
          <span className='text-4xl font-bold'>{formatPrice(plan.price)}</span>
          {plan.price > 0 && (
            <span className='text-muted-foreground'>/{plan.interval === 'month' ? '월' : plan.interval}</span>
          )}
        </div>

        <ul className='space-y-3'>
          <li className='flex items-center gap-2'>
            <Home className='size-4 text-primary' />
            <span>
              숙소 <strong>{plan.quotas.maxAccommodations}개</strong> 등록
            </span>
          </li>
          <li className='flex items-center gap-2'>
            <Clock className='size-4 text-primary' />
            <span>
              <strong>{plan.quotas.checkIntervalMin}분</strong>마다 가격 체크
            </span>
          </li>
          <li className='flex items-center gap-2'>
            <Zap className='size-4 text-primary' />
            <span>실시간 카카오톡 알림</span>
          </li>
          <li className='flex items-center gap-2'>
            <Check className='size-4 text-primary' />
            <span>가격 추이 그래프</span>
          </li>
          {plan.name !== 'FREE' && (
            <li className='flex items-center gap-2'>
              <Check className='size-4 text-primary' />
              <span>우선 지원</span>
            </li>
          )}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button
            className='w-full'
            variant='outline'
            disabled
          >
            현재 이용 중
          </Button>
        ) : plan.price === 0 ? (
          <Button
            className='w-full'
            variant='outline'
            asChild
          >
            <Link href='/signup'>무료로 시작하기</Link>
          </Button>
        ) : (
          <Button
            className='w-full'
            asChild
          >
            <Link href={`mailto:rlgns0610@gmail.com?subject=${plan.name} 플랜 업그레이드 문의`}>업그레이드 문의</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function PricingCardsSkeleton() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto'>
      {[1, 2, 3].map((i) => (
        <Card
          key={i}
          className='flex flex-col'
        >
          <CardHeader className='text-center'>
            <Skeleton className='h-6 w-20 mx-auto' />
            <Skeleton className='h-4 w-32 mx-auto mt-2' />
          </CardHeader>
          <CardContent className='flex-1'>
            <Skeleton className='h-10 w-24 mx-auto mb-6' />
            <div className='space-y-3'>
              {[1, 2, 3, 4].map((j) => (
                <Skeleton
                  key={j}
                  className='h-5 w-full'
                />
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

export function PricingCards() {
  const { data: plans, isLoading, isError } = usePlans();
  const { data: userQuota } = useUserQuota();

  const currentPlanName = userQuota?.planName;

  if (isLoading) {
    return <PricingCardsSkeleton />;
  }

  if (isError || !plans) {
    return <div className='text-center text-muted-foreground py-12'>플랜 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12 max-w-5xl mx-auto px-4 pt-4'>
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isCurrentPlan={plan.name === currentPlanName}
        />
      ))}
    </div>
  );
}
