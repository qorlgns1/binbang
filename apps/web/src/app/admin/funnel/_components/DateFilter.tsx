'use client';

import { startOfUtcDay, endOfUtcDay, addUtcDays } from '@workspace/shared/utils/date';

import { Button } from '@/components/ui/button';
import type { FunnelRangePreset } from '@/types/admin';

export const FUNNEL_DATE_FILTER_OPTIONS: Array<{ value: FunnelRangePreset; label: string }> = [
  { value: 'today', label: '오늘' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: 'all', label: '전체' },
];

export interface FunnelUtcFilter {
  range: FunnelRangePreset;
  from?: string;
  to?: string;
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
        from: startOfUtcDay(addUtcDays(now, -29)).toISOString(),
        to: to.toISOString(),
      };
    case 'all':
      return {
        range,
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
