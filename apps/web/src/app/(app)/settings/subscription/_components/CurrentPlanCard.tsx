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

function formatPrice(price: number, interval: string): string {
  if (price === 0) return '무료';
  const formatted = new Intl.NumberFormat('ko-KR').format(price);
  const intervalLabel = interval === 'month' ? '월' : interval === 'year' ? '년' : interval;
  return `₩${formatted}/${intervalLabel}`;
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

  return (
    <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Sparkles className='size-5 text-primary' />
            현재 플랜
          </CardTitle>
          <Badge variant={isFree ? 'secondary' : 'default'}>{plan.name}</Badge>
        </div>
        <CardDescription>{plan.description ?? '필요한 만큼만, 편안하게'}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='text-3xl font-bold text-primary'>{formatPrice(plan.price, plan.interval)}</div>
        <Button asChild className='w-full bg-primary text-primary-foreground hover:bg-primary/90'>
          <Link href='/pricing'>
            {isFree ? '플랜 업그레이드' : '플랜 변경'}
            <ArrowUpRight className='size-4 ml-2' />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
