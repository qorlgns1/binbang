'use client';

import { useMemo, useState } from 'react';

import { usePriceHistory } from '@/hooks/usePriceHistory';
import { cn } from '@/lib/utils';

import { PriceChart } from './priceChart';
import { PriceStatCards } from './priceStatCards';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface Props {
  accommodationId: string;
}

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
  { value: 'all', label: '전체' },
];

function getFromDate(range: TimeRange): string | undefined {
  if (range === 'all') return undefined;
  const now = new Date();
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

export function PriceTrendSection({ accommodationId }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const filters = useMemo(() => {
    const from = getFromDate(timeRange);
    return from ? { from } : {};
  }, [timeRange]);

  const { data, isLoading } = usePriceHistory(accommodationId, filters);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold'>가격 분석</h2>
        <div className='flex gap-1'>
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
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
      </div>

      <PriceStatCards
        stats={data?.stats ?? null}
        isLoading={isLoading}
      />
      <PriceChart
        prices={data?.prices ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
