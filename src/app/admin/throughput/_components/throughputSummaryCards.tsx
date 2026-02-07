'use client';

import { Activity, CheckCircle, Clock, Settings } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useThroughputSummary } from '@/hooks/useThroughputSummary';

interface Props {
  filters: { from?: string; to?: string };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}분 ${remainSeconds}초`;
}

function SummaryCardsSkeleton() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      {Array.from({ length: 4 }).map((_, i) => (
        <Card
          size='sm'
          key={i}
        >
          <CardHeader>
            <Skeleton className='h-4 w-24' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-16 mb-2' />
            <Skeleton className='h-3 w-32' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ThroughputSummaryCards({ filters }: Props) {
  const { data, isLoading, isError } = useThroughputSummary(filters);

  if (isLoading) return <SummaryCardsSkeleton />;

  if (isError || !data) {
    return (
      <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
        처리량 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
      {/* 평균 처리량/분 */}
      <Card size='sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Activity className='size-4' />
            평균 처리량/분
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-2xl font-bold'>{data.avgThroughputPerMin}</p>
          <p className='text-xs text-muted-foreground'>총 {data.totalChecks}건 체크</p>
        </CardContent>
      </Card>

      {/* 마지막 사이클 */}
      <Card size='sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Clock className='size-4' />
            마지막 사이클
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.lastCycle ? (
            <>
              <p className='text-2xl font-bold'>{data.lastCycle.totalCount}건</p>
              <p className='text-xs text-muted-foreground'>{formatDuration(data.lastCycle.durationMs)} 소요</p>
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>사이클 데이터 없음</p>
          )}
        </CardContent>
      </Card>

      {/* 성공률 */}
      <Card size='sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
            <CheckCircle className='size-4' />
            성공률
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p
            className={`text-2xl font-bold ${
              data.successRate >= 90
                ? 'text-status-success-foreground'
                : data.successRate >= 70
                  ? 'text-status-warning-foreground'
                  : 'text-status-error-foreground'
            }`}
          >
            {data.successRate}%
          </p>
          <p className='text-xs text-muted-foreground'>
            {data.successCount} 성공 / {data.errorCount} 에러
          </p>
        </CardContent>
      </Card>

      {/* 현재 설정 */}
      <Card size='sm'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Settings className='size-4' />
            현재 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.lastCycle ? (
            <>
              <p className='text-2xl font-bold'>
                {data.lastCycle.concurrency} x {data.lastCycle.browserPoolSize}
              </p>
              <p className='text-xs text-muted-foreground'>Concurrency x Pool Size</p>
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>워커 재시작 후 표시</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
