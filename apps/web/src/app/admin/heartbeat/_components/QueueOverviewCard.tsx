'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { QueueStatsInfo } from '@/types/admin';

interface QueueOverviewCardProps {
  title: string;
  stats: QueueStatsInfo | null;
  isLoading: boolean;
}

const METRIC_KEYS = ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'] as const;

const METRIC_LABELS: Record<(typeof METRIC_KEYS)[number], string> = {
  waiting: 'Waiting',
  active: 'Active',
  completed: 'Completed',
  failed: 'Failed',
  delayed: 'Delayed',
  paused: 'Paused',
};

function getMetricClassName(metric: (typeof METRIC_KEYS)[number], value: number): string {
  if (metric === 'failed' && value > 0) return 'text-status-error-foreground';
  if (metric === 'active' && value > 0) return 'text-status-warning-foreground';
  if (metric === 'completed' && value > 0) return 'text-status-success-foreground';
  return 'text-foreground';
}

export function QueueOverviewCard({ title, stats, isLoading }: QueueOverviewCardProps) {
  if (isLoading) {
    return (
      <Card className='animate-dashboard-enter'>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <span>{title}</span>
            <Skeleton className='h-5 w-14' />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            {METRIC_KEYS.map((metric) => (
              <div key={metric} className='rounded-md border p-3 space-y-1'>
                <Skeleton className='h-3 w-16' />
                <Skeleton className='h-5 w-10' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className='animate-dashboard-enter'>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>큐 데이터를 불러오지 못했습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const hasFailures = stats.failed > 0;

  return (
    <Card className='animate-dashboard-enter'>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <span>{title}</span>
          <Badge
            className={hasFailures ? 'bg-status-error text-status-error-foreground' : 'bg-muted'}
            variant='secondary'
          >
            {hasFailures ? '주의 필요' : '정상'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          {METRIC_KEYS.map((metric) => {
            const value = stats[metric];
            return (
              <div key={metric} className='rounded-md border p-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>{METRIC_LABELS[metric]}</p>
                <p className={`text-lg font-semibold ${getMetricClassName(metric, value)}`}>{value}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
