'use client';

import { ArrowRightLeft } from 'lucide-react';

import type { ExchangeRateData } from '@/lib/types';

interface CurrencyCardProps {
  data: ExchangeRateData;
}

export function CurrencyCard({ data }: CurrencyCardProps) {
  return (
    <div className='rounded-xl border border-border bg-card p-4 my-2'>
      <div className='flex items-center gap-2 mb-3'>
        <ArrowRightLeft className='h-4 w-4 text-primary' />
        <h4 className='font-semibold text-sm'>Exchange Rates (1 {data.baseCurrency})</h4>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        {Object.entries(data.rates).map(([currency, rate]) => (
          <div key={currency} className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2'>
            <span className='text-sm font-medium'>{currency}</span>
            <span className='text-sm font-semibold text-primary'>{rate > 0 ? rate.toFixed(2) : 'N/A'}</span>
          </div>
        ))}
      </div>
      <div className='mt-2 text-[10px] text-muted-foreground text-right'>
        Last updated: {new Date(data.lastUpdated).toLocaleDateString()}
      </div>
    </div>
  );
}
