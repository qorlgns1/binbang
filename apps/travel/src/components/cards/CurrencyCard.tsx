'use client';

import { ArrowRightLeft, Calculator } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { ExchangeRateData } from '@/lib/types';

interface CurrencyCardProps {
  data: ExchangeRateData;
}

export function CurrencyCard({ data }: CurrencyCardProps) {
  const [amount, setAmount] = useState(1);
  const ratesList = useMemo(() => Object.entries(data.rates).filter(([, r]) => r > 0), [data.rates]);
  return (
    <div className='my-2 rounded-xl border border-border bg-card p-4'>
      <div className='mb-3 flex items-center gap-2'>
        <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
          <ArrowRightLeft className='h-4 w-4 text-primary' />
        </div>
        <h4 className='font-semibold text-sm'>환율 (1 {data.baseCurrency})</h4>
      </div>
      <div className='mb-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2'>
        <Calculator className='h-4 w-4 shrink-0 text-muted-foreground' />
        <input
          type='number'
          min={0}
          step={0.01}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className='w-20 rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20'
        />
        <span className='text-sm text-muted-foreground'>{data.baseCurrency} =</span>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        {ratesList.map(([currency, rate]) => (
          <div key={currency} className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2'>
            <span className='text-sm font-medium'>{currency}</span>
            <span className='text-sm font-semibold text-primary'>{(amount * rate).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className='mt-2 text-right text-[10px] text-muted-foreground'>
        기준: {new Date(data.lastUpdated).toLocaleDateString()}
      </div>
    </div>
  );
}
