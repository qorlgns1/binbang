'use client';

import { Activity, AlertTriangle, CheckCircle, Clock, Database, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMonitoringSummary } from '@/hooks/useMonitoringSummary';
import type { MonitoringSummary } from '@/types/admin';

const SUMMARY_SKELETON_KEYS = ['summary-1', 'summary-2', 'summary-3', 'summary-4', 'summary-5'];

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

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
  const config = {
    healthy: { label: 'Healthy', className: 'bg-status-success text-status-success-foreground' },
    degraded: {
      label: 'Degraded',
      className: 'bg-status-warning text-status-warning-foreground',
    },
    down: { label: 'Down', className: 'bg-status-error text-status-error-foreground' },
  };
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}

function SummaryCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Card size='sm' className='animate-dashboard-enter'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Icon className='size-4' />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function WorkerCard({ data }: { data: MonitoringSummary }) {
  return (
    <SummaryCard title='Worker Health' icon={Activity}>
      <div className='space-y-2'>
        <div className='flex items-center gap-2'>
          <StatusBadge status={data.worker.status} />
          {data.worker.isProcessing && <span className='text-xs text-muted-foreground'>처리 중</span>}
        </div>
        <p className='text-xs text-muted-foreground'>
          마지막 heartbeat: {formatRelativeTime(data.worker.lastHeartbeatAt)}
        </p>
      </div>
    </SummaryCard>
  );
}

function DbCard({ data }: { data: MonitoringSummary }) {
  return (
    <SummaryCard title='Database' icon={Database}>
      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <Badge
            className={
              data.db.connected
                ? 'bg-status-success text-status-success-foreground'
                : 'bg-status-error text-status-error-foreground'
            }
          >
            {data.db.connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
        <p className='text-xs text-muted-foreground'>Latency: {data.db.latencyMs}ms</p>
      </div>
    </SummaryCard>
  );
}

function CheckRateCard({ data }: { data: MonitoringSummary }) {
  const rate = data.checkRate24h.rate;
  const rateColor =
    rate >= 90
      ? 'text-status-success-foreground'
      : rate >= 70
        ? 'text-status-warning-foreground'
        : 'text-status-error-foreground';

  return (
    <SummaryCard title='Check Success Rate (24h)' icon={CheckCircle}>
      <div className='space-y-1'>
        <p className={`text-2xl font-bold ${rateColor}`}>{rate}%</p>
        <p className='text-xs text-muted-foreground'>
          {data.checkRate24h.success} / {data.checkRate24h.total} 건
        </p>
      </div>
    </SummaryCard>
  );
}

function RecentErrorsCard({ data }: { data: MonitoringSummary }) {
  const hasErrors = data.recentErrors1h.count > 0;
  return (
    <SummaryCard title='Recent Errors (1h)' icon={AlertTriangle}>
      <div className='space-y-1'>
        <p
          className={`text-2xl font-bold ${hasErrors ? 'text-status-error-foreground' : 'text-status-success-foreground'}`}
        >
          {data.recentErrors1h.count}
        </p>
        {data.recentErrors1h.lastMessage && (
          <p className='text-xs text-muted-foreground truncate' title={data.recentErrors1h.lastMessage}>
            {data.recentErrors1h.lastMessage}
          </p>
        )}
      </div>
    </SummaryCard>
  );
}

function LastSuccessCard({ data }: { data: MonitoringSummary }) {
  return (
    <SummaryCard title='Last Successful Check' icon={Clock}>
      <div className='space-y-1'>
        <p className='text-lg font-semibold'>{formatRelativeTime(data.lastSuccessfulCheck)}</p>
        <p className='text-xs text-muted-foreground'>활성 숙소: {data.activeAccommodations}개</p>
      </div>
    </SummaryCard>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
      {SUMMARY_SKELETON_KEYS.map((key) => (
        <Card size='sm' key={key} className='animate-dashboard-enter'>
          <CardHeader>
            <Skeleton className='h-4 w-24' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-16 mb-2' />
            <Skeleton className='h-3 w-32' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SummaryCards() {
  const { data, isLoading, isError } = useMonitoringSummary();

  if (isLoading) return <SummaryCardsSkeleton />;

  if (isError || !data) {
    return (
      <div className='rounded-lg border border-border p-6 text-center text-muted-foreground'>
        모니터링 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'>
      <WorkerCard data={data} />
      <DbCard data={data} />
      <CheckRateCard data={data} />
      <RecentErrorsCard data={data} />
      <LastSuccessCard data={data} />
    </div>
  );
}
