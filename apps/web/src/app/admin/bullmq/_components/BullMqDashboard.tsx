'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueueStats } from '@/types/bullmq';
import { fetchAllQueues } from '../_lib/bullmqApiClient';
import { JobsTable } from './JobsTable';
import { QueueStatsCards } from './QueueStatsCards';
import { SchedulersSection } from './SchedulersSection';

interface BullMQDashboardProps {
  initialQueues: QueueStats[];
}

const AUTO_REFRESH_MS = 10_000;

export function BullMQDashboard({ initialQueues }: BullMQDashboardProps) {
  const [queues, setQueues] = useState<QueueStats[]>(initialQueues);
  const [queuesError, setQueuesError] = useState<string | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<string>(initialQueues[0]?.name ?? 'accommodation-check-cycle');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_MS / 1000);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQueues = useCallback(async () => {
    setQueuesError(null);
    try {
      const data = await fetchAllQueues();
      setQueues(data);
    } catch (err) {
      setQueuesError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const doRefresh = useCallback(() => {
    void loadQueues();
    setRefreshTick((t) => t + 1);
    setCountdown(AUTO_REFRESH_MS / 1000);
  }, [loadQueues]);

  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    const schedule = () => {
      timerRef.current = setTimeout(() => {
        doRefresh();
        schedule();
      }, AUTO_REFRESH_MS);
    };

    setCountdown(AUTO_REFRESH_MS / 1000);
    schedule();
    countdownRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, doRefresh]);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>BullMQ 대시보드</h1>
        <div className='flex items-center gap-3'>
          {autoRefresh && <span className='text-sm text-muted-foreground'>{countdown}초 후 갱신</span>}
          <Button variant={autoRefresh ? 'default' : 'outline'} size='sm' onClick={() => setAutoRefresh((v) => !v)}>
            {autoRefresh ? '자동 갱신 ON' : '자동 갱신 OFF'}
          </Button>
          <Button variant='outline' size='sm' onClick={doRefresh}>
            새로고침
          </Button>
        </div>
      </div>

      {queuesError && <p className='text-sm text-destructive'>{queuesError}</p>}

      <QueueStatsCards
        queues={queues}
        selectedQueue={selectedQueue}
        onSelectQueue={setSelectedQueue}
        onRefresh={() => {
          void loadQueues();
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className='font-mono text-sm'>{selectedQueue}</CardTitle>
        </CardHeader>
        <CardContent>
          <JobsTable queueName={selectedQueue} refreshTick={refreshTick} />
        </CardContent>
      </Card>

      <SchedulersSection refreshTick={refreshTick} />
    </div>
  );
}
