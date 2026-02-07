'use client';

import { useState } from 'react';

import { Separator } from '@/components/ui/separator';

import { ThroughputChart } from './throughputChart';
import { ThroughputComparisonChart } from './throughputComparisonChart';
import { ThroughputHistoryTable } from './throughputHistoryTable';
import { ThroughputSummaryCards } from './throughputSummaryCards';

type TimeRange = '1h' | '6h' | '24h' | '7d';

function getTimeRange(range: TimeRange): { from: string; to?: string } {
  const now = new Date();
  const from = new Date(now);

  switch (range) {
    case '1h':
      from.setHours(from.getHours() - 1);
      break;
    case '6h':
      from.setHours(from.getHours() - 6);
      break;
    case '24h':
      from.setDate(from.getDate() - 1);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
  }

  return { from: from.toISOString() };
}

export function ThroughputDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const filters = getTimeRange(timeRange);

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>처리량 분석</h1>
        <p className='text-muted-foreground mt-2'>설정 조합별 분당 숙소 처리량을 기록하고 비교합니다.</p>
      </div>

      <Separator />

      <ThroughputSummaryCards filters={filters} />

      <Separator />

      <ThroughputChart
        filters={filters}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <ThroughputComparisonChart filters={filters} />
      </div>

      <Separator />

      <ThroughputHistoryTable filters={filters} />
    </div>
  );
}
