'use client';

import { Cloud, Droplets, Thermometer } from 'lucide-react';

import type { WeatherData } from '@/lib/types';

interface WeatherCardProps {
  data: WeatherData;
}

export function WeatherCard({ data }: WeatherCardProps) {
  return (
    <div className='rounded-xl border border-border bg-card p-4 my-2'>
      <div className='flex items-center gap-2 mb-3'>
        <Cloud className='h-4 w-4 text-primary' />
        <h4 className='font-semibold text-sm'>
          Weather in {data.city}, {data.country}
        </h4>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
        {data.monthly.map((m) => (
          <div key={m.month} className='rounded-lg bg-muted/50 p-2 text-center'>
            <div className='text-xs font-medium text-muted-foreground'>{m.monthName.slice(0, 3)}</div>
            <div className='flex items-center justify-center gap-1 mt-1'>
              <Thermometer className='h-3 w-3 text-orange-500' />
              <span className='text-sm font-semibold'>{m.avgTempC}°C</span>
            </div>
            <div className='flex items-center justify-center gap-1 mt-0.5'>
              <Droplets className='h-3 w-3 text-blue-500' />
              <span className='text-xs text-muted-foreground'>{m.rainfallMm}mm</span>
            </div>
            <div className='text-[10px] text-muted-foreground mt-0.5 truncate'>{m.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
