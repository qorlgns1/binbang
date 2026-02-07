'use client';

import { useMemo, useState } from 'react';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMonitoringLogs } from '@/hooks/useMonitoringLogs';
import type { MonitoringLogEntry } from '@/types/admin';

const PERIOD_OPTIONS = [
  { value: '1h', label: '1시간' },
  { value: '6h', label: '6시간' },
  { value: '24h', label: '24시간' },
  { value: '7d', label: '7일' },
] as const;

const STATUS_OPTIONS = [
  { value: 'all', label: '전체 상태' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'UNAVAILABLE', label: 'Unavailable' },
  { value: 'ERROR', label: 'Error' },
  { value: 'UNKNOWN', label: 'Unknown' },
] as const;

const PLATFORM_OPTIONS = [
  { value: 'all', label: '전체 플랫폼' },
  { value: 'AIRBNB', label: 'Airbnb' },
  { value: 'AGODA', label: 'Agoda' },
] as const;

function getPeriodFrom(period: string): string {
  const now = Date.now();
  const ms: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  };
  return new Date(now - (ms[period] ?? ms['24h'])).toISOString();
}

function StatusBadge({ status }: { status: MonitoringLogEntry['status'] }) {
  const config: Record<string, { label: string; className: string }> = {
    AVAILABLE: {
      label: 'Available',
      className: 'bg-status-success text-status-success-foreground',
    },
    UNAVAILABLE: {
      label: 'Unavailable',
      className: 'bg-status-neutral text-status-neutral-foreground',
    },
    ERROR: { label: 'Error', className: 'bg-status-error text-status-error-foreground' },
    UNKNOWN: {
      label: 'Unknown',
      className: 'bg-status-warning text-status-warning-foreground',
    },
  };
  const { label, className } = config[status] ?? config.UNKNOWN;
  return <Badge className={className}>{label}</Badge>;
}

function TableSkeleton() {
  return (
    <div className='space-y-2'>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          className='h-10 w-full'
        />
      ))}
    </div>
  );
}

export function LogsTimeline() {
  const [period, setPeriod] = useState('24h');
  const [status, setStatus] = useState('all');
  const [platform, setPlatform] = useState('all');

  const filters = useMemo(
    () => ({
      from: getPeriodFrom(period),
      ...(status !== 'all' ? { status } : {}),
      ...(platform !== 'all' ? { platform } : {}),
    }),
    [period, status, platform],
  );

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useMonitoringLogs(filters);

  const logs = data?.pages.flatMap((p) => p.logs) ?? [];

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <Select
          value={period}
          onValueChange={setPeriod}
        >
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={setStatus}
        >
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={platform}
          onValueChange={setPlatform}
        >
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
          로그를 불러올 수 없습니다.
        </div>
      ) : logs.length === 0 ? (
        <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
          해당 기간에 로그가 없습니다.
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>숙소명</TableHead>
                <TableHead>플랫폼</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>가격</TableHead>
                <TableHead>에러</TableHead>
                <TableHead>알림</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className='text-xs text-muted-foreground'>
                    {format(new Date(log.createdAt), 'MM/dd HH:mm', { locale: ko })}
                  </TableCell>
                  <TableCell className='font-medium max-w-40 truncate'>{log.accommodation.name}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{log.accommodation.platform}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={log.status} />
                  </TableCell>
                  <TableCell className='text-xs'>{log.price ?? '-'}</TableCell>
                  <TableCell
                    className='text-xs text-muted-foreground max-w-48 truncate'
                    title={log.errorMessage ?? undefined}
                  >
                    {log.errorMessage ?? '-'}
                  </TableCell>
                  <TableCell className='text-xs'>
                    {log.notificationSent ? (
                      <Badge className='bg-status-success text-status-success-foreground'>Sent</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {hasNextPage && (
            <div className='flex justify-center pt-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? '로딩 중...' : '더 보기'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
