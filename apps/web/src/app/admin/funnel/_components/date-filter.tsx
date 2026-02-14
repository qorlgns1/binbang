'use client';

import { Button } from '@/components/ui/button';
import type { FunnelRangePreset } from '@/types/admin';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const FUNNEL_DATE_FILTER_OPTIONS: Array<{ value: FunnelRangePreset; label: string }> = [
  { value: 'today', label: '오늘' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: 'all', label: '전체' },
];

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function endOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export interface FunnelUtcFilter {
  range: FunnelRangePreset;
  from: string;
  to: string;
}

export function buildUtcFilterFromRange(range: FunnelRangePreset, now: Date = new Date()): FunnelUtcFilter {
  const to = endOfUtcDay(now);

  switch (range) {
    case 'today':
      return {
        range,
        from: startOfUtcDay(now).toISOString(),
        to: to.toISOString(),
      };
    case '7d':
      return {
        range,
        from: startOfUtcDay(addUtcDays(now, -6)).toISOString(),
        to: to.toISOString(),
      };
    case '30d':
      return {
        range,
        from: startOfUtcDay(addUtcDays(now, -30)).toISOString(),
        to: to.toISOString(),
      };
    case 'all':
      return {
        range,
        from: new Date('1970-01-01T00:00:00.000Z').toISOString(),
        to: to.toISOString(),
      };
  }
}

interface DateFilterProps {
  value: FunnelRangePreset;
  onChange: (next: FunnelUtcFilter) => void;
  disabled?: boolean;
}

export function DateFilter({ value, onChange, disabled = false }: DateFilterProps) {
  return (
    <div className='flex flex-wrap items-center gap-2'>
      {FUNNEL_DATE_FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type='button'
          variant={value === option.value ? 'default' : 'outline'}
          aria-pressed={value === option.value}
          data-active={value === option.value}
          disabled={disabled}
          onClick={() => onChange(buildUtcFilterFromRange(option.value))}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
