'use client';

import { Cloud, Droplets, Thermometer } from 'lucide-react';
import { useMemo } from 'react';

import type { WeatherData } from '@/lib/types';

interface WeatherCardProps {
  data: WeatherData;
}

const maxTemp = (monthly: WeatherData['monthly']) => (monthly.length ? Math.max(...monthly.map((m) => m.avgTempC)) : 0);

export function WeatherCard({ data }: WeatherCardProps) {
  const peak = useMemo(() => maxTemp(data.monthly), [data.monthly]);
  return (
    <div className='my-2 rounded-xl border border-border bg-card p-4'>
      <div className='mb-3 flex items-center gap-2'>
        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
          <Cloud className='h-4 w-4 text-primary' />
        </div>
        <h4 className='font-semibold text-sm'>
          {data.city}, {data.country}
        </h4>
      </div>
      <div className='mb-3 flex h-8 items-end gap-1'>
        {data.monthly.map((m) => (
          <div
            key={m.month}
            className='flex-1 rounded-t bg-amber-500/80 transition-all'
            style={{ height: peak > 0 ? `${(m.avgTempC / peak) * 100}%` : 0 }}
            title={`${m.monthName}: ${m.avgTempC}°C`}
          />
        ))}
      </div>
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
        {data.monthly.map((m) => (
          <div key={m.month} className='rounded-lg bg-muted/50 p-2 text-center'>
            <div className='text-xs font-medium text-muted-foreground'>{m.monthName.slice(0, 3)}</div>
            <div className='mt-1 flex items-center justify-center gap-1'>
              <Thermometer className='h-3 w-3 shrink-0 text-orange-500' />
              <span className='text-sm font-semibold'>{m.avgTempC}°C</span>
            </div>
            <div className='mt-0.5 flex items-center justify-center gap-1'>
              <Droplets className='h-3 w-3 shrink-0 text-blue-500' />
              <span className='text-xs text-muted-foreground'>{m.rainfallMm}mm</span>
            </div>
            <div className='mt-0.5 truncate text-[10px] text-muted-foreground'>{m.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
