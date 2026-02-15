'use client';

import { ArrowDown, ArrowUp, BarChart3, Moon, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/priceFormat';
import type { PriceStats } from '@/types/accommodation';

interface Props {
  stats: PriceStats | null;
  isLoading: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatCardsSkeleton() {
  const skeletonKeys = ['stat-card-1', 'stat-card-2', 'stat-card-3', 'stat-card-4'];

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      {skeletonKeys.map((key) => (
        <Card size='sm' key={key}>
          <CardHeader>
            <Skeleton className='h-4 w-20' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-24 mb-2' />
            <Skeleton className='h-3 w-16' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PriceStatCards({ stats, isLoading }: Props) {
  if (isLoading) return <StatCardsSkeleton />;
  if (!stats) return null;

  const currency = stats.currentCurrency ?? 'KRW';
  const pn = stats.perNight;

  return (
    <div className='space-y-4'>
      {/* 전체 가격 통계 */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* 현재 가격 */}
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
              <TrendingUp className='size-4' />
              현재 가격
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{stats.current != null ? formatPrice(stats.current, currency) : '-'}</p>
            <p className='text-xs text-muted-foreground'>{stats.count}건 기록</p>
          </CardContent>
        </Card>

        {/* 평균 가격 */}
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
              <BarChart3 className='size-4' />
              평균 가격
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatPrice(stats.avg, currency)}</p>
            <p className='text-xs text-muted-foreground'>전체 평균</p>
          </CardContent>
        </Card>

        {/* 최저 가격 */}
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
              <ArrowDown className='size-4' />
              최저 가격
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatPrice(stats.min, currency)}</p>
            <p className='text-xs text-muted-foreground'>{formatDate(stats.minDate)}</p>
          </CardContent>
        </Card>

        {/* 최고 가격 */}
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
              <ArrowUp className='size-4' />
              최고 가격
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{formatPrice(stats.max, currency)}</p>
            <p className='text-xs text-muted-foreground'>{formatDate(stats.maxDate)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 박당 가격 통계 */}
      {pn && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card size='sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Moon className='size-4' />
                현재 1박
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{pn.current != null ? formatPrice(pn.current, currency) : '-'}</p>
              <p className='text-xs text-muted-foreground'>1박 기준</p>
            </CardContent>
          </Card>

          <Card size='sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
                <BarChart3 className='size-4' />
                평균 1박
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{formatPrice(pn.avg, currency)}</p>
              <p className='text-xs text-muted-foreground'>1박 평균</p>
            </CardContent>
          </Card>

          <Card size='sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
                <ArrowDown className='size-4' />
                최저 1박
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{formatPrice(pn.min, currency)}</p>
              <p className='text-xs text-muted-foreground'>{formatDate(pn.minDate)}</p>
            </CardContent>
          </Card>

          <Card size='sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
                <ArrowUp className='size-4' />
                최고 1박
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{formatPrice(pn.max, currency)}</p>
              <p className='text-xs text-muted-foreground'>{formatDate(pn.maxDate)}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
