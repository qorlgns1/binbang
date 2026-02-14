'use client';

import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { FunnelRangePreset } from '@/types/admin';

import { ConversionMatrix } from './_components/conversion-matrix';
import { DateFilter } from './_components/date-filter';
import { KpiCards } from './_components/kpi-cards';
import { useFunnelQuery } from './_hooks/use-funnel-query';

export default function FunnelPage() {
  const [range, setRange] = useState<FunnelRangePreset>('30d');
  const query = useFunnelQuery(range);

  const handleRangeChange = (next: FunnelRangePreset): void => {
    if (next === range) return;

    console.info('[admin/funnel] filter_change', {
      from: range,
      to: next,
      changedAt: new Date().toISOString(),
    });
    setRange(next);
  };

  return (
    <main className='max-w-7xl mx-auto px-4 py-8 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold'>운영 퍼널</h1>
        <p className='text-muted-foreground'>서버 SoT 기준 제출/처리/결제확인/조건충족 퍼널을 조회합니다.</p>
      </div>

      <DateFilter value={range} onChange={handleRangeChange} disabled={query.isPending} />

      {query.isPending && (
        <Card>
          <CardContent className='py-6 text-sm text-muted-foreground'>퍼널 데이터를 불러오는 중입니다.</CardContent>
        </Card>
      )}

      {query.isError && (
        <Card>
          <CardContent className='py-6 text-sm text-destructive'>
            퍼널 데이터를 불러오지 못했습니다: {query.error.message}
          </CardContent>
        </Card>
      )}

      {query.data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>조회 범위</CardTitle>
              <CardDescription>UTC 기준으로 집계됩니다.</CardDescription>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              {query.data.range.from} ~ {query.data.range.to} ({query.data.range.timezone})
            </CardContent>
          </Card>

          <KpiCards kpis={query.data.kpis} />

          <ConversionMatrix conversion={query.data.conversion} />

          <Card>
            <CardHeader>
              <CardTitle>일별 시계열 (UTC)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>date</TableHead>
                    <TableHead className='text-right'>submitted</TableHead>
                    <TableHead className='text-right'>processed</TableHead>
                    <TableHead className='text-right'>paymentConfirmed</TableHead>
                    <TableHead className='text-right'>conditionMet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.series.map((item) => (
                    <TableRow key={item.date}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className='text-right'>{item.submitted}</TableCell>
                      <TableCell className='text-right'>{item.processed}</TableCell>
                      <TableCell className='text-right'>{item.paymentConfirmed}</TableCell>
                      <TableCell className='text-right'>{item.conditionMet}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}
