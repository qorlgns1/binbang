'use client';

import { useState } from 'react';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useThroughputComparison } from '@/hooks/useThroughputComparison';

interface Props {
  filters: { from?: string; to?: string };
}

type CompareBy = 'concurrency' | 'browserPoolSize';

const COMPARE_OPTIONS: { value: CompareBy; label: string }[] = [
  { value: 'concurrency', label: 'Concurrency' },
  { value: 'browserPoolSize', label: 'Browser Pool Size' },
];

const chartConfig = {
  avgThroughputPerMin: {
    label: '평균 처리량/분',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function ThroughputComparisonChart({ filters }: Props) {
  const [compareBy, setCompareBy] = useState<CompareBy>('concurrency');
  const { data, isLoading } = useThroughputComparison({ compareBy, ...filters });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[250px] w-full' />
        </CardContent>
      </Card>
    );
  }

  const chartData =
    data?.groups.map((g) => ({
      name: String(g.value),
      avgThroughputPerMin: g.avgThroughputPerMin,
      cycleCount: g.cycleCount,
      avgSuccessRate: g.avgSuccessRate,
    })) ?? [];

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle>설정별 비교</CardTitle>
        <Select value={compareBy} onValueChange={(v) => setCompareBy(v as CompareBy)}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPARE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className='flex items-center justify-center h-[250px] text-muted-foreground'>
            비교할 데이터가 없습니다.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className='h-[250px] w-full'>
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey='name' tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey='avgThroughputPerMin' fill='var(--color-avgThroughputPerMin)' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
