'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatBrowserLocalDateTime } from '@/lib/datetime/formatBrowserLocal';
import type { AffiliateCategoryFilter } from '@/types/admin';

import { useAffiliateFunnelQuery } from './_hooks/useAffiliateFunnelQuery';
import { ClickKpiCards } from './_components/ClickKpiCards';
import { ConversionMatrix } from './_components/ConversionMatrix';
import { DateFilter, buildUtcFilterFromRange, type FunnelUtcFilter } from './_components/DateFilter';
import { GrowthConversionMatrix } from './_components/GrowthConversionMatrix';
import { GrowthKpiCards } from './_components/GrowthKpiCards';
import { KpiCards } from './_components/KpiCards';
import { useFunnelClicksQuery } from './_hooks/useFunnelClicksQuery';
import { useFunnelGrowthQuery } from './_hooks/useFunnelGrowthQuery';
import { useFunnelQuery } from './_hooks/useFunnelQuery';

export default function FunnelPage() {
  const [filter, setFilter] = useState<FunnelUtcFilter>(() => buildUtcFilterFromRange('30d'));
  const [affiliateCategory, setAffiliateCategory] = useState<AffiliateCategoryFilter>('all');
  const [browserTimezone, setBrowserTimezone] = useState('UTC');
  const query = useFunnelQuery(filter);
  const clickQuery = useFunnelClicksQuery(filter);
  const growthQuery = useFunnelGrowthQuery(filter);
  const affiliateQuery = useAffiliateFunnelQuery({ ...filter, category: affiliateCategory });
  const isPending = query.isPending || clickQuery.isPending || growthQuery.isPending || affiliateQuery.isPending;
  const errorMessages = [
    query.isError ? query.error.message : null,
    clickQuery.isError ? clickQuery.error.message : null,
    growthQuery.isError ? growthQuery.error.message : null,
    affiliateQuery.isError ? affiliateQuery.error.message : null,
  ].filter((value): value is string => Boolean(value));
  const errorMessage = errorMessages.length > 0 ? errorMessages.join('; ') : null;

  const handleRangeChange = (next: FunnelUtcFilter): void => {
    if (next.range === filter.range && next.from === filter.from && next.to === filter.to) return;

    if (process.env.NODE_ENV === 'development') {
      console.info('[admin/funnel] filter_change', {
        fromRange: filter.range,
        toRange: next.range,
        from: next.from,
        to: next.to,
        changedAt: new Date().toISOString(),
      });
    }
    setFilter(next);
  };

  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (resolved) setBrowserTimezone(resolved);
  }, []);

  const formatLocalDateTime = (value: string, withTime = true): string =>
    formatBrowserLocalDateTime(value, {
      withTime,
      timeZone: browserTimezone,
    });

  return (
    <main className='max-w-7xl mx-auto px-4 py-8 space-y-6'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold text-foreground'>운영 퍼널</h1>
        <p className='text-base leading-relaxed text-muted-foreground'>
          서버 SoT 기준 제출/처리/결제확인/조건충족 퍼널을 조회합니다.
        </p>
      </div>

      <DateFilter value={filter.range} onChange={handleRangeChange} disabled={isPending} />
      <div className='flex items-center gap-3'>
        <label htmlFor='affiliate-category' className='text-sm text-muted-foreground'>
          제휴 카테고리
        </label>
        <select
          id='affiliate-category'
          value={affiliateCategory}
          onChange={(event) => setAffiliateCategory(event.target.value as AffiliateCategoryFilter)}
          className='h-9 rounded-md border border-border bg-background px-3 text-sm'
          disabled={isPending}
        >
          <option value='all'>전체</option>
          <option value='accommodation'>accommodation</option>
          <option value='esim'>esim</option>
          <option value='flight'>flight</option>
          <option value='car_rental'>car_rental</option>
          <option value='travel_package'>travel_package</option>
          <option value='other'>other</option>
        </select>
      </div>

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

      {query.data && clickQuery.data && growthQuery.data && affiliateQuery.data && (
        <>
          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>조회 범위</CardTitle>
              <CardDescription>{browserTimezone} 기준 표시 (필터/저장은 UTC)</CardDescription>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              {formatLocalDateTime(query.data.filter.from)} ~ {formatLocalDateTime(query.data.filter.to)}
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
              {formatLocalDateTime(clickQuery.data.filter.from)} ~ {formatLocalDateTime(clickQuery.data.filter.to)}
            </CardContent>
          </Card>

          <ClickKpiCards totals={clickQuery.data.totals} />

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>요청 클릭 → 제출 전환율</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground space-y-1'>
              <p className='text-3xl font-semibold text-foreground'>
                {(clickQuery.data.navRequestToSubmitted * 100).toFixed(1)}%
              </p>
              <p>
                submitted {clickQuery.data.submitted} / nav_request {clickQuery.data.totals.navRequest}
              </p>
            </CardContent>
          </Card>

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>Growth 지표 (3차)</CardTitle>
              <CardDescription>Organic 유입부터 가입/첫 알림 생성까지 전환을 조회합니다.</CardDescription>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground'>
              {formatLocalDateTime(growthQuery.data.filter.from)} ~ {formatLocalDateTime(growthQuery.data.filter.to)}
            </CardContent>
          </Card>

          <GrowthKpiCards kpis={growthQuery.data.kpis} />

          <GrowthConversionMatrix conversion={growthQuery.data.conversion} />

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>Affiliate 퍼널 (Stage A)</CardTitle>
              <CardDescription>
                impression → outbound_click 전환율. 카테고리 필터 기준이며 집계 캐시는 5분 TTL입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <p className='text-xs text-muted-foreground'>
                캐시 정책: TTL {affiliateQuery.data.cache.ttlSeconds}초, 무효화=
                {affiliateQuery.data.cache.invalidation}, 이벤트 즉시 무효화=
                {affiliateQuery.data.cache.immediateInvalidationOnEvent ? 'enabled' : 'disabled'}
              </p>
              <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
                <div className='rounded-lg border border-border p-3'>
                  <p className='text-xs text-muted-foreground'>impression</p>
                  <p className='text-2xl font-semibold'>{affiliateQuery.data.totals.impression.toLocaleString()}</p>
                </div>
                <div className='rounded-lg border border-border p-3'>
                  <p className='text-xs text-muted-foreground'>cta_attempt</p>
                  <p className='text-2xl font-semibold'>{affiliateQuery.data.totals.ctaAttempt.toLocaleString()}</p>
                </div>
                <div className='rounded-lg border border-border p-3'>
                  <p className='text-xs text-muted-foreground'>outbound_click</p>
                  <p className='text-2xl font-semibold'>{affiliateQuery.data.totals.outboundClick.toLocaleString()}</p>
                </div>
                <div className='rounded-lg border border-border p-3'>
                  <p className='text-xs text-muted-foreground'>CTR</p>
                  <p className='text-2xl font-semibold'>
                    {(affiliateQuery.data.totals.clickThroughRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>Awin 수익 요약</CardTitle>
              <CardDescription>approved transactions 기준 (기간: 위 필터 범위)</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2 text-sm text-muted-foreground'>
              <p>
                상태: <span className='font-medium text-foreground'>{affiliateQuery.data.revenue.status}</span>
              </p>
              <p>
                전환 건수:{' '}
                <span className='font-medium text-foreground'>
                  {affiliateQuery.data.revenue.conversionCount.toLocaleString()}
                </span>
              </p>
              <p>
                수익:{' '}
                <span className='font-medium text-foreground'>
                  {affiliateQuery.data.revenue.commissionAmount.toLocaleString()}
                </span>{' '}
                {affiliateQuery.data.revenue.currency ?? ''}
              </p>
              {affiliateQuery.data.revenue.message && <p>메시지: {affiliateQuery.data.revenue.message}</p>}
            </CardContent>
          </Card>

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>카테고리별 Affiliate 지표</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>category</TableHead>
                    <TableHead className='text-right'>impression</TableHead>
                    <TableHead className='text-right'>cta_attempt</TableHead>
                    <TableHead className='text-right'>outbound_click</TableHead>
                    <TableHead className='text-right'>CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateQuery.data.byCategory.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className='text-right'>{item.impression.toLocaleString()}</TableCell>
                      <TableCell className='text-right'>{item.ctaAttempt.toLocaleString()}</TableCell>
                      <TableCell className='text-right'>{item.outboundClick.toLocaleString()}</TableCell>
                      <TableCell className='text-right'>{(item.clickThroughRate * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>Provider별 Affiliate 지표</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>provider</TableHead>
                    <TableHead className='text-right'>impression</TableHead>
                    <TableHead className='text-right'>cta_attempt</TableHead>
                    <TableHead className='text-right'>outbound_click</TableHead>
                    <TableHead className='text-right'>CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateQuery.data.byProvider.map((item) => (
                    <TableRow key={item.provider}>
                      <TableCell>{item.provider}</TableCell>
                      <TableCell className='text-right'>{item.impression.toLocaleString()}</TableCell>
                      <TableCell className='text-right'>{item.ctaAttempt.toLocaleString()}</TableCell>
                      <TableCell className='text-right'>{item.outboundClick.toLocaleString()}</TableCell>
                      <TableCell className='text-right'>{(item.clickThroughRate * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='animate-dashboard-enter'>
            <CardHeader>
              <CardTitle>일별 시계열 (브라우저 로컬)</CardTitle>
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
                      <TableCell>{formatLocalDateTime(`${item.date}T00:00:00.000Z`, false)}</TableCell>
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
