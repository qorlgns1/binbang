'use client';

import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatKstDateTime } from '@/lib/datetime/format-kst';

import { ClickKpiCards } from './_components/click-kpi-cards';
import { ConversionMatrix } from './_components/conversion-matrix';
import { DateFilter, buildUtcFilterFromRange, type FunnelUtcFilter } from './_components/date-filter';
import { KpiCards } from './_components/kpi-cards';
import { useFunnelClicksQuery } from './_hooks/use-funnel-clicks-query';
import { useFunnelQuery } from './_hooks/use-funnel-query';

export default function FunnelPage() {
  const [filter, setFilter] = useState<FunnelUtcFilter>(() => buildUtcFilterFromRange('30d'));
  const query = useFunnelQuery(filter);
  const clickQuery = useFunnelClicksQuery(filter);
  const isPending = query.isPending || clickQuery.isPending;
  const errorMessage = query.isError ? query.error.message : clickQuery.isError ? clickQuery.error.message : null;

  const handleRangeChange = (next: FunnelUtcFilter): void => {
    if (next.range === filter.range && next.from === filter.from && next.to === filter.to) return;

    console.info('[admin/funnel] filter_change', {
      fromRange: filter.range,
      toRange: next.range,
      from: next.from,
      to: next.to,
      changedAt: new Date().toISOString(),
    });
    setFilter(next);
  };

  return (
    <main className='max-w-7xl mx-auto px-4 py-8 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>운영 퍼널</h1>
        <p className='text-base leading-relaxed text-muted-foreground'>
          서버 SoT 기준 제출/처리/결제확인/조건충족 퍼널을 조회합니다.
        </p>
      </div>

      <DateFilter value={filter.range} onChange={handleRangeChange} disabled={isPending} />

      {isPending && (
        <Card className='animate-dashboard-enter'>
          <CardContent className='py-6 text-sm text-muted-foreground'>퍼널 데이터를 불러오는 중입니다.</CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className='animate-dashboard-enter'>
          <CardContent className='py-6 text-sm text-destructive'>
            퍼널 데이터를 불러오지 못했습니다: {errorMessage}
          </CardContent>
        </Card>
      )}

      {query.data && clickQuery.data && (
        <>
          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>조회 범위</CardTitle>
              <CardDescription>{query.data.displayTimezone} 기준 표시 (필터/저장은 UTC)</CardDescription>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              {formatKstDateTime(query.data.filter.from)} ~ {formatKstDateTime(query.data.filter.to)}
            </CardContent>
          </Card>

          <KpiCards kpis={query.data.kpis} />

          <ConversionMatrix conversion={query.data.conversion} />

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>클릭 지표 (2차)</CardTitle>
              <CardDescription>P0-9b 라벨: 클릭 이벤트는 1차 KPI와 분리 집계됩니다.</CardDescription>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              {formatKstDateTime(clickQuery.data.filter.from)} ~ {formatKstDateTime(clickQuery.data.filter.to)}
            </CardContent>
          </Card>

          <ClickKpiCards totals={clickQuery.data.totals} />

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>클릭 → 제출 전환율</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground space-y-1'>
              <p className='text-3xl font-semibold text-foreground'>
                {(clickQuery.data.clickToSubmitted * 100).toFixed(1)}%
              </p>
              <p>
                submitted {clickQuery.data.submitted} / nav_request {clickQuery.data.totals.navRequest}
              </p>
            </CardContent>
          </Card>

          <Card className='animate-dashboard-enter'>
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
                      <TableCell>{formatKstDateTime(`${item.date}T00:00:00.000Z`, { withTime: false })}</TableCell>
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
