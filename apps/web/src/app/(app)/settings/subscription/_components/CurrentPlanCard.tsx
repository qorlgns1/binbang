'use client';

import Link from 'next/link';

import { ArrowUpRight, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SubscriptionPlanInfo } from '@/types/subscription';

interface Props {
  plan: SubscriptionPlanInfo | null;
  isLoading: boolean;
  isError: boolean;
}

function CardSkeleton(): React.ReactElement {
  return (
    <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
      <CardHeader>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-4 w-48' />
      </CardHeader>
      <CardContent className='space-y-4'>
        <Skeleton className='h-8 w-32' />
        <Skeleton className='h-4 w-full' />
      </CardContent>
    </Card>
  );
}

function getAccessLabel(plan: SubscriptionPlanInfo): string {
  if (plan.price === 0) return '베타 무료 이용 중';
  return `${plan.name} 운영 플랜 사용 중`;
}

export function CurrentPlanCard({ plan, isLoading, isError }: Props): React.ReactElement {
  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !plan) {
    return (
      <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
        <CardContent className='pt-6'>
          <div className='text-center text-muted-foreground py-4'>플랜 정보를 불러올 수 없습니다.</div>
        </CardContent>
      </Card>
    );
  }

  const isFree = plan.price === 0;
  const accessLabel = getAccessLabel(plan);

  return (
    <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='size-5 text-primary' />
            현재 이용 상태
          </CardTitle>
          <Badge variant={isFree ? 'secondary' : 'default'}>{plan.name}</Badge>
        </div>
        <CardDescription>{plan.description ?? '현재 제공 범위를 기준으로 이용 상태를 안내합니다.'}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <div className='text-2xl font-bold text-primary'>{accessLabel}</div>
          <p className='mt-2 text-sm leading-7 text-muted-foreground'>
            {isFree
              ? '정식 결제 없이 핵심 모니터링 흐름을 먼저 검증하는 단계입니다.'
              : '정식 유료화 전 단계라 가격보다 실제 사용 범위와 운영 기준을 우선 안내합니다.'}
          </p>
        </div>
        <Button asChild className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
          <Link href='/pricing'>
            베타 운영 안내
            <ArrowUpRight className='size-4 ml-2' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
