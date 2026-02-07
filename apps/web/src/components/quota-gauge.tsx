'use client';

import Link from 'next/link';

import { ArrowUpRight, Clock, Home } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserQuota } from '@/hooks/useUserQuota';

export function QuotaGauge() {
  const { data, isLoading, isError } = useUserQuota();

  if (isLoading) {
    return (
      <Card>
        <CardContent className='pt-4'>
          <div className='space-y-3'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-2 w-full' />
            <Skeleton className='h-3 w-32' />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return null;
  }

  const { planName, quotas, usage } = data;
  const usagePercent = Math.min((usage.accommodations / quotas.maxAccommodations) * 100, 100);
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usage.accommodations >= quotas.maxAccommodations;

  return (
    <Card>
      <CardContent className='pt-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='text-xs'
            >
              {planName}
            </Badge>
            <span className='text-sm text-muted-foreground'>플랜</span>
            <Button
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              asChild
            >
              <Link href='/pricing'>
                업그레이드
                <ArrowUpRight className='size-3 ml-1' />
              </Link>
            </Button>
          </div>
          <div className='flex items-center gap-1 text-xs text-muted-foreground'>
            <Clock className='size-3' />
            <span>{quotas.checkIntervalMin}분마다 체크</span>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Home className='size-4 text-muted-foreground' />
              <span className='text-sm font-medium'>숙소 사용량</span>
            </div>
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
          {isAtLimit && (
            <p className='text-xs text-destructive'>
              숙소 한도에 도달했습니다. 플랜을 업그레이드하거나 기존 숙소를 삭제해주세요.
            </p>
          )}
          {isNearLimit && !isAtLimit && <p className='text-xs text-status-warning'>숙소 한도에 거의 도달했습니다.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
