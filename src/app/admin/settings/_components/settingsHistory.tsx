'use client';

import { useMemo, useState } from 'react';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSettingsHistory } from '@/hooks/useSettingsHistory';
import { useSystemSettings } from '@/hooks/useSystemSettings';

const PERIOD_OPTIONS = [
  { value: '1h', label: '1시간' },
  { value: '6h', label: '6시간' },
  { value: '24h', label: '24시간' },
  { value: '7d', label: '7일' },
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

function isMsSetting(key: string): boolean {
  return key.endsWith('Ms');
}

function formatMsValue(value: string): string {
  const num = Number(value);
  if (isNaN(num)) return value;
  if (num >= 60000 && num % 60000 === 0) return `${num / 60000}min`;
  if (num >= 1000 && num % 1000 === 0) return `${num / 1000}s`;
  return `${num}ms`;
}

function ValueDisplay({ settingKey, value }: { settingKey: string; value: string }) {
  if (isMsSetting(settingKey)) {
    return (
      <span>
        {value} <span className='text-muted-foreground'>({formatMsValue(value)})</span>
      </span>
    );
  }
  return <span>{value}</span>;
}

function TableSkeleton() {
  return (
    <div className='space-y-2'>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton
          key={i}
          className='h-10 w-full'
        />
      ))}
    </div>
  );
}

export function SettingsHistory() {
  const [period, setPeriod] = useState('24h');
  const [settingKey, setSettingKey] = useState('all');

  const { data: settingsData } = useSystemSettings();

  const settingKeys = useMemo(() => {
    if (!settingsData?.settings) return [];
    return [...new Set(settingsData.settings.map((s) => s.key))].sort();
  }, [settingsData]);

  const filters = useMemo(
    () => ({
      from: getPeriodFrom(period),
      ...(settingKey !== 'all' ? { settingKey } : {}),
    }),
    [period, settingKey],
  );

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useSettingsHistory(filters);

  const logs = data?.pages.flatMap((p) => p.logs) ?? [];

  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>변경 이력</h3>

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
          value={settingKey}
          onValueChange={setSettingKey}
        >
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체 설정</SelectItem>
            {settingKeys.map((key) => (
              <SelectItem
                key={key}
                value={key}
              >
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
          변경 이력을 불러올 수 없습니다.
        </div>
      ) : logs.length === 0 ? (
        <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
          해당 기간에 변경 이력이 없습니다.
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>설정 키</TableHead>
                <TableHead>이전 값</TableHead>
                <TableHead>변경 값</TableHead>
                <TableHead>변경자</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className='text-xs text-muted-foreground whitespace-nowrap'>
                    {format(new Date(log.createdAt), 'MM/dd HH:mm', { locale: ko })}
                  </TableCell>
                  <TableCell className='font-medium text-sm'>{log.settingKey}</TableCell>
                  <TableCell className='text-xs'>
                    <ValueDisplay
                      settingKey={log.settingKey}
                      value={log.oldValue}
                    />
                  </TableCell>
                  <TableCell className='text-xs'>
                    <ValueDisplay
                      settingKey={log.settingKey}
                      value={log.newValue}
                    />
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>{log.changedBy.name ?? '-'}</TableCell>
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
