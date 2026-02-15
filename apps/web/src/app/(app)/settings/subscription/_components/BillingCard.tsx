'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertCircle, Calendar, CreditCard } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscriptionStatus } from '@workspace/db/enums';
import type { SubscriptionDetailInfo } from '@/types/subscription';

interface Props {
  subscription: SubscriptionDetailInfo;
  isLoading: boolean;
}

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [SubscriptionStatus.ACTIVE]: { label: '활성', variant: 'default' },
  [SubscriptionStatus.TRIALING]: { label: '체험 중', variant: 'secondary' },
  [SubscriptionStatus.PAST_DUE]: { label: '결제 지연', variant: 'destructive' },
  [SubscriptionStatus.CANCELED]: { label: '취소됨', variant: 'outline' },
  [SubscriptionStatus.EXPIRED]: { label: '만료됨', variant: 'outline' },
};

function CardSkeleton(): React.ReactElement {
  return (
    <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
      <CardHeader>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-4 w-32' />
      </CardHeader>
      <CardContent className='space-y-4'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-3/4' />
      </CardContent>
    </Card>
  );
}

export function BillingCard({ subscription, isLoading }: Props): React.ReactElement {
  if (isLoading) {
    return <CardSkeleton />;
  }

  const statusConfig = STATUS_CONFIG[subscription.status];
  const isPastDue = subscription.status === SubscriptionStatus.PAST_DUE;
  const isCanceled = subscription.canceledAt !== null;

  return (
    <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <CreditCard className='size-5 text-primary' />
            결제 정보
          </CardTitle>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>
        <CardDescription>구독 및 결제 상태</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isPastDue && (
          <div className='flex items-start gap-3 p-3 rounded-lg bg-destructive/10 text-destructive'>
            <AlertCircle className='size-5 flex-shrink-0 mt-0.5' />
            <div>
              <p className='text-sm font-medium'>결제가 지연되었습니다</p>
              <p className='text-sm'>결제 수단을 확인해주세요.</p>
            </div>
          </div>
        )}

        <div className='grid gap-4'>
          <div className='flex items-center gap-3'>
            <Calendar className='size-5 text-muted-foreground' />
            <div>
              <p className='text-sm font-medium'>{isCanceled ? '서비스 종료일' : '다음 결제일'}</p>
              <p className='text-sm text-muted-foreground'>
                {format(new Date(subscription.currentPeriodEnd), 'yyyy년 M월 d일', { locale: ko })}
              </p>
            </div>
          </div>

          {isCanceled && subscription.canceledAt && (
            <div className='flex items-start gap-3 p-3 rounded-lg bg-muted/50'>
              <AlertCircle className='size-5 text-muted-foreground flex-shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium'>구독이 취소되었습니다</p>
                <p className='text-sm text-muted-foreground'>
                  {format(new Date(subscription.canceledAt), 'yyyy년 M월 d일', { locale: ko })}에 취소됨
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
