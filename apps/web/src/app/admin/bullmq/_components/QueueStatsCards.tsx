'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueueStats } from '@/types/bullmq';
import { sendQueueControl } from '../_lib/bullmqApiClient';

interface QueueStatsCardsProps {
  queues: QueueStats[];
  selectedQueue: string;
  onSelectQueue: (name: string) => void;
  onRefresh: () => void;
}

export function QueueStatsCards({ queues, selectedQueue, onSelectQueue, onRefresh }: QueueStatsCardsProps) {
  const [controlLoading, setControlLoading] = useState<Record<string, boolean>>({});
  const [controlError, setControlError] = useState<Record<string, string>>({});

  async function handleControl(queueName: string, body: Record<string, unknown>) {
    setControlLoading((prev) => ({ ...prev, [queueName]: true }));
    setControlError((prev) => ({ ...prev, [queueName]: '' }));
    try {
      await sendQueueControl(queueName, body);
      onRefresh();
    } catch (err) {
      setControlError((prev) => ({
        ...prev,
        [queueName]: err instanceof Error ? err.message : String(err),
      }));
    } finally {
      setControlLoading((prev) => ({ ...prev, [queueName]: false }));
    }
  }

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {queues.map((queue) => {
        const isSelected = queue.name === selectedQueue;
        const loading = controlLoading[queue.name] ?? false;
        const err = controlError[queue.name];

        return (
          <Card
            key={queue.name}
            className={`cursor-pointer transition-colors ${isSelected ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/40'}`}
            onClick={() => onSelectQueue(queue.name)}
          >
            <CardHeader className='pb-2'>
              <div className='flex items-center justify-between'>
                <CardTitle className='font-mono text-sm'>{queue.name}</CardTitle>
                <div className='flex items-center gap-1.5'>
                  {queue.isPaused && <Badge variant='secondary'>PAUSED</Badge>}
                  {queue.failed > 0 && <Badge variant='destructive'>FAILED: {queue.failed}</Badge>}
                </div>
              </div>
              <CardDescription className='text-xs'>클릭하여 잡 목록 조회</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-3 grid grid-cols-5 gap-2 text-center text-xs'>
                {(['waiting', 'active', 'failed', 'completed', 'delayed'] as const).map((key) => (
                  <div
                    key={key}
                    className={`rounded px-1 py-2 ${key === 'failed' && queue.failed > 0 ? 'bg-destructive/15' : 'bg-muted/50'}`}
                  >
                    <p
                      className={`font-semibold ${key === 'failed' && queue.failed > 0 ? 'text-destructive' : 'text-foreground'}`}
                    >
                      {queue[key]}
                    </p>
                    <p className='text-muted-foreground'>{key === 'completed' ? 'done' : key}</p>
                  </div>
                ))}
              </div>

              {err && <p className='mb-2 text-xs text-destructive'>{err}</p>}

              <div className='flex flex-wrap gap-1.5' role='none' onClick={(e) => e.stopPropagation()}>
                {queue.isPaused ? (
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={loading}
                    onClick={() => {
                      void handleControl(queue.name, { action: 'resume' });
                    }}
                  >
                    Resume
                  </Button>
                ) : (
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={loading}
                    onClick={() => {
                      void handleControl(queue.name, { action: 'pause' });
                    }}
                  >
                    Pause
                  </Button>
                )}
                <Button
                  size='sm'
                  variant='outline'
                  disabled={loading}
                  onClick={() => {
                    if (confirm(`${queue.name} waiting 잡을 모두 삭제하시겠습니까?`)) {
                      void handleControl(queue.name, { action: 'drain' });
                    }
                  }}
                >
                  Drain
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={loading}
                  onClick={() => {
                    if (confirm(`${queue.name}의 완료된 잡을 정리하시겠습니까?`)) {
                      void handleControl(queue.name, { action: 'clean', state: 'completed', graceMs: 0, limit: 1000 });
                    }
                  }}
                >
                  Clean Completed
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
