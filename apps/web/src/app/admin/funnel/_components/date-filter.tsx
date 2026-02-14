'use client';

import { Button } from '@/components/ui/button';
import type { FunnelRangePreset } from '@/types/admin';

export const FUNNEL_DATE_FILTER_OPTIONS: Array<{ value: FunnelRangePreset; label: string }> = [
  { value: 'today', label: '오늘' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: 'all', label: '전체' },
];

interface DateFilterProps {
  value: FunnelRangePreset;
  onChange: (next: FunnelRangePreset) => void;
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
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
