'use client';

import { useMemo } from 'react';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatPriceShort } from '@/lib/priceFormat';
import type { PriceDataPoint } from '@/types/accommodation';

interface Props {
  prices: PriceDataPoint[];
  isLoading: boolean;
}

const chartConfig = {
  price: {
    label: '가격',
    color: 'var(--chart-1)',
  },
  movingAvg: {
    label: '7일 이동평균',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export function PriceChart({ prices, isLoading }: Props) {
  const currency = prices[0]?.priceCurrency ?? 'KRW';

  const chartData = useMemo(() => {
    if (prices.length === 0) return [];

    return prices.map((p) => ({
      time: formatTime(p.createdAt),
      fullTime: p.createdAt,
      price: p.priceAmount,
      movingAvg: p.movingAvg ?? undefined,
    }));
  }, [prices]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[300px] w-full' />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>가격 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-[300px] text-muted-foreground'>
            가격 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>가격 추이</CardTitle>
      </CardHeader>
      <CardContent>
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
              tickFormatter={(value: number) => formatPriceShort(value, currency)}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => formatPrice(value as number, currency)} />}
            />
            <Line
              type='monotone'
              dataKey='price'
              stroke='var(--color-price)'
              strokeWidth={2}
              dot={false}
            />
            <Line
              type='monotone'
              dataKey='movingAvg'
              stroke='var(--color-movingAvg)'
              strokeWidth={1.5}
              dot={false}
              strokeDasharray='6 3'
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
