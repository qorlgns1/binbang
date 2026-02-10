'use client';

import { Activity, Power, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useHeartbeatStatus } from '@/hooks/useHeartbeatStatus';
import { useWorkerControl } from '@/hooks/useWorkerControl';

import { HeartbeatTimeline } from './_components/HeartbeatTimeline';

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '-';
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function StatusCard() {
  const { data: status, isLoading } = useHeartbeatStatus();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='size-5' />
            워커 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex justify-between'>
              <span>상태</span>
              <Skeleton className='h-4 w-16' />
            </div>
            <div className='flex justify-between'>
              <span>마지막 하트비트</span>
              <Skeleton className='h-4 w-20' />
            </div>
            <div className='flex justify-between'>
              <span>처리 상태</span>
              <Skeleton className='h-4 w-16' />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColor = status?.isHealthy ? 'text-status-success-foreground' : 'text-status-error-foreground';
  const statusBgColor = status?.isHealthy ? 'bg-status-success' : 'bg-status-error';

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Activity className='size-5' />
          워커 상태
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <span>상태</span>
            <Badge className={statusBgColor} variant='secondary'>
              <span className={statusColor}>{status?.workerStatus || '알 수 없음'}</span>
            </Badge>
          </div>

          <div className='flex justify-between'>
            <span>마지막 하트비트</span>
            <span className='text-sm text-muted-foreground'>{formatRelativeTime(status?.lastHeartbeat || null)}</span>
          </div>

          <div className='flex justify-between'>
            <span>처리 상태</span>
            <Badge variant={status?.isProcessing ? 'default' : 'secondary'}>
              {status?.isProcessing ? '처리 중' : '대기 중'}
            </Badge>
          </div>

          {/* 🆕 Progress Bar 통합 */}
          <Separator />
          <HeartbeatTimeline />
        </div>
      </CardContent>
    </Card>
  );
}

function WorkerControlCard() {
  const { restartWorker, isRestarting } = useWorkerControl();
  const { data: status } = useHeartbeatStatus();

  const isWorkerRunning = status?.status === 'healthy';

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Power className='size-5' />
          워커 제어
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => restartWorker()}
            disabled={isRestarting}
            className='flex items-center gap-2 w-full'
          >
            <RefreshCw className={`size-4 ${isRestarting ? 'animate-spin' : ''}`} />
            {isRestarting ? '재시작 중...' : '워커 재시작'}
          </Button>

          <div className='text-xs text-muted-foreground text-center'>
            현재 상태: {isWorkerRunning ? '실행 중' : '중지됨'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HeartbeatPage() {
  return (
    <main className='max-w-7xl mx-auto px-4 py-8'>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>하트비트 모니터링</h1>
          <p className='text-muted-foreground mt-2'>워커 프로세스의 실시간 상태를 모니터링하고 제어합니다.</p>
        </div>

        <Separator />

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            <StatusCard />
          </div>
          <div className='space-y-6'>
            <WorkerControlCard />
          </div>
        </div>
      </div>
    </main>
  );
}
