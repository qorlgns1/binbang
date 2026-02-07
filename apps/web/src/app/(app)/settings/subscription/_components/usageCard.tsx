'use client';

import { Clock, Home } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { SubscriptionQuotaInfo, SubscriptionUsageInfo } from '@/types/subscription';

interface Props {
  quotas: SubscriptionQuotaInfo | null;
  usage: SubscriptionUsageInfo | null;
  isLoading: boolean;
  isError: boolean;
}

function CardSkeleton(): React.ReactElement {
  return (
    <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
      <CardHeader>
        <Skeleton className='h-5 w-24' />
        <Skeleton className='h-4 w-32' />
      </CardHeader>
      <CardContent className='space-y-4'>
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-2 w-full' />
        <Skeleton className='h-4 w-32' />
      </CardContent>
    </Card>
  );
}

export function UsageCard({ quotas, usage, isLoading, isError }: Props): React.ReactElement {
  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !quotas || !usage) {
    return (
      <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
        <CardContent className='pt-6'>
          <div className='text-center text-muted-foreground py-4'>사용량 정보를 불러올 수 없습니다.</div>
        </CardContent>
      </Card>
    );
  }

  const usagePercent = Math.min((usage.accommodations / quotas.maxAccommodations) * 100, 100);
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usage.accommodations >= quotas.maxAccommodations;

  return (
    <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Home className='size-5 text-primary' />
          사용량
        </CardTitle>
        <CardDescription>지금 불을 밝히고 있는 곳</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>등록된 숙소</span>
            <span
              className={`text-sm font-medium ${
                isAtLimit ? 'text-destructive' : isNearLimit ? 'text-status-warning' : 'text-foreground'
              }`}
            >
              {usage.accommodations} / {quotas.maxAccommodations}
            </span>
          </div>
          <Progress
            value={usagePercent}
            className={`h-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-status-warning' : ''}`}
          />
          {isAtLimit && <p className='text-xs text-destructive'>숙소 한도에 도달했습니다. 플랜 업그레이드를 고려해보세요.</p>}
          {isNearLimit && !isAtLimit && <p className='text-xs text-status-warning'>숙소 한도에 거의 도달했습니다.</p>}
        </div>

        <div className='flex items-center gap-3 p-3 rounded-lg bg-muted/50'>
          <Clock className='size-5 text-muted-foreground' />
          <div>
            <p className='text-sm font-medium'>체크 주기</p>
            <p className='text-sm text-muted-foreground'>{quotas.checkIntervalMin}분마다 자동 체크</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
