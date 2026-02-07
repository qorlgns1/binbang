'use client';

import { useMemo } from 'react';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useThroughputHistory } from '@/hooks/useThroughputHistory';
import { cn } from '@/lib/utils';

type TimeRange = '1h' | '6h' | '24h' | '7d';

interface Props {
  filters: { from?: string; to?: string };
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1시간' },
  { value: '6h', label: '6시간' },
  { value: '24h', label: '24시간' },
  { value: '7d', label: '7일' },
];

const chartConfig = {
  throughputPerMin: {
    label: '처리량/분',
    color: 'var(--chart-1)',
  },
  successCount: {
    label: '성공',
    color: 'var(--chart-2)',
  },
  errorCount: {
    label: '에러',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig;

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function ThroughputChart({ filters, timeRange, onTimeRangeChange }: Props) {
  const { data: historyData, isLoading } = useThroughputHistory(filters);

  const chartData = useMemo(() => {
    if (!historyData?.buckets) return [];
    return historyData.buckets.map((bucket) => ({
      time: formatTime(bucket.bucketStart),
      throughputPerMin: bucket.throughputPerMin,
      successCount: bucket.successCount,
      errorCount: bucket.errorCount,
    }));
  }, [historyData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[300px] w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>처리량 추이</CardTitle>
        <div className='flex gap-1'>
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => onTimeRangeChange(range.value)}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                timeRange === range.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className='flex items-center justify-center h-[300px] text-muted-foreground'>
            해당 기간에 데이터가 없습니다.
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='h-[300px] w-full'
          >
            <LineChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='time'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type='monotone'
                dataKey='throughputPerMin'
                stroke='var(--color-throughputPerMin)'
                strokeWidth={2}
                dot={false}
              />
              <Line
                type='monotone'
                dataKey='successCount'
                stroke='var(--color-successCount)'
                strokeWidth={1}
                dot={false}
                strokeDasharray='4 2'
              />
              <Line
                type='monotone'
                dataKey='errorCount'
                stroke='var(--color-errorCount)'
                strokeWidth={1}
                dot={false}
                strokeDasharray='4 2'
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
