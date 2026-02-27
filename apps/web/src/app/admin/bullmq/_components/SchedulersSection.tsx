'use client';

import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SchedulerInfo } from '@/types/bullmq';
import { fetchSchedulers, triggerSchedulerApi } from '../_lib/bullmqApiClient';

interface SchedulersSectionProps {
  refreshTick: number;
}

function formatTs(ts: number | null): string {
  if (!ts) return '-';
  const abs = new Date(ts).toLocaleString('ko-KR', { hour12: false });
  const diff = ts - Date.now();
  if (diff < 0) return `${abs} (과거)`;
  const secs = Math.floor(diff / 1000);
  return secs < 60 ? `${abs} (${secs}초 후)` : `${abs} (${Math.floor(secs / 60)}분 후)`;
}

export function SchedulersSection({ refreshTick }: SchedulersSectionProps) {
  const [schedulers, setSchedulers] = useState<SchedulerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [triggerLoading, setTriggerLoading] = useState<Record<string, boolean>>({});
  const [triggerResults, setTriggerResults] = useState<Record<string, { ok: boolean; message: string }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchSchedulers(refreshTick);
      setSchedulers(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [refreshTick]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleTrigger(id: string) {
    setTriggerLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await triggerSchedulerApi(id);
      setTriggerResults((prev) => ({ ...prev, [id]: result }));
    } finally {
      setTriggerLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Job Schedulers</CardTitle>
        <CardDescription>accommodation-check-cycle 큐의 반복 스케줄러 목록</CardDescription>
      </CardHeader>
      <CardContent>
        {fetchError && <p className='mb-2 text-sm text-destructive'>{fetchError}</p>}

        {loading && schedulers.length === 0 ? (
          <p className='text-sm text-muted-foreground'>로딩 중...</p>
        ) : schedulers.length === 0 ? (
          <p className='text-sm text-muted-foreground'>스케줄러가 없습니다.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Pattern / Every</TableHead>
                <TableHead>다음 실행</TableHead>
                <TableHead>트리거</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedulers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className='font-mono text-xs'>{s.id}</TableCell>
                  <TableCell className='text-sm'>{s.name}</TableCell>
                  <TableCell className='font-mono text-xs'>{s.pattern ?? s.every ?? '-'}</TableCell>
                  <TableCell className='text-xs text-muted-foreground'>{formatTs(s.nextRunAt)}</TableCell>
                  <TableCell>
                    {s.canTrigger ? (
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={triggerLoading[s.id] ?? false}
                          onClick={() => {
                            void handleTrigger(s.id);
                          }}
                        >
                          즉시 실행
                        </Button>
                        {triggerResults[s.id] && (
                          <Badge variant={triggerResults[s.id].ok ? 'default' : 'destructive'}>
                            {triggerResults[s.id].ok ? 'OK' : 'ERR'}
                          </Badge>
                        )}
                        {triggerResults[s.id] && !triggerResults[s.id].ok && (
                          <span className='max-w-xs truncate text-xs text-destructive'>
                            {triggerResults[s.id].message}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className='text-xs text-muted-foreground'>—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
