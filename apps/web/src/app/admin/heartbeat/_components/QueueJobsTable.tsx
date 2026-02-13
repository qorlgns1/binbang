'use client';

import { useEffect, useMemo, useState } from 'react';

import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { QueueJobState, QueueJobSummary } from '@/types/admin';

interface QueueJobsTableProps {
  cycleJobs: QueueJobSummary[];
  checkJobs: QueueJobSummary[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

interface DisplayQueueJob extends QueueJobSummary {
  queue: 'cycle' | 'check';
  rowKey: string;
}

const TABLE_SKELETON_ROWS = ['row-1', 'row-2', 'row-3', 'row-4'];

function getStateBadgeClass(state: QueueJobState): string {
  switch (state) {
    case 'active':
      return 'bg-status-warning text-status-warning-foreground';
    case 'completed':
      return 'bg-status-success text-status-success-foreground';
    case 'failed':
      return 'bg-status-error text-status-error-foreground';
    case 'waiting':
      return 'bg-status-neutral text-status-neutral-foreground';
    case 'delayed':
    case 'paused':
      return 'bg-status-neutral text-status-neutral-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function QueueTableSkeleton() {
  return (
    <div className='space-y-2'>
      {TABLE_SKELETON_ROWS.map((row) => (
        <Skeleton key={row} className='h-10 w-full' />
      ))}
    </div>
  );
}

function buildDisplayJobs(queue: 'cycle' | 'check', jobs: QueueJobSummary[]): DisplayQueueJob[] {
  return jobs.map((job) => ({
    ...job,
    queue,
    rowKey: `${queue}:${job.id}`,
  }));
}

export function QueueJobsTable({ cycleJobs, checkJobs, isLoading, isError, errorMessage }: QueueJobsTableProps) {
  const [queueTab, setQueueTab] = useState<'cycle' | 'check'>('check');
  const [selectedJobKey, setSelectedJobKey] = useState<string | null>(null);

  const cycleRows = useMemo(() => buildDisplayJobs('cycle', cycleJobs), [cycleJobs]);
  const checkRows = useMemo(() => buildDisplayJobs('check', checkJobs), [checkJobs]);
  const currentRows = queueTab === 'check' ? checkRows : cycleRows;

  useEffect(() => {
    if (currentRows.length === 0) {
      setSelectedJobKey(null);
      return;
    }

    if (!selectedJobKey || !currentRows.some((row) => row.rowKey === selectedJobKey)) {
      setSelectedJobKey(currentRows[0].rowKey);
    }
  }, [currentRows, selectedJobKey]);

  const selectedJob = currentRows.find((row) => row.rowKey === selectedJobKey) ?? null;
  const hasJobs = cycleRows.length > 0 || checkRows.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 큐 작업</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground'>
          <p>`waiting`: 아직 실행되지 않은 대기 작업 수</p>
          <p>`active`: 현재 워커가 처리 중인 작업 수</p>
          <p>`failed`: 오류로 종료된 작업 수(원인 확인 필요)</p>
          <p>`delayed`: 지정 시각 이후 실행 예정 작업 수</p>
        </div>

        {isLoading ? (
          <QueueTableSkeleton />
        ) : isError ? (
          <Alert variant='destructive'>
            <AlertTriangle className='size-4' />
            <AlertTitle>큐 작업을 불러오지 못했습니다.</AlertTitle>
            <AlertDescription>{errorMessage || '잠시 후 다시 시도해주세요.'}</AlertDescription>
          </Alert>
        ) : !hasJobs ? (
          <div className='rounded-lg border p-6 text-center text-muted-foreground'>최근 작업 내역이 없습니다.</div>
        ) : (
          <Tabs value={queueTab} onValueChange={(value) => setQueueTab(value as 'cycle' | 'check')}>
            <TabsList>
              <TabsTrigger value='check'>Check Queue ({checkRows.length})</TabsTrigger>
              <TabsTrigger value='cycle'>Cycle Queue ({cycleRows.length})</TabsTrigger>
            </TabsList>

            <TabsContent value='check' className='space-y-4'>
              <QueueJobsGrid
                rows={checkRows}
                selectedJobKey={selectedJobKey}
                onSelectJob={(jobKey) => setSelectedJobKey(jobKey)}
              />
            </TabsContent>

            <TabsContent value='cycle' className='space-y-4'>
              <QueueJobsGrid
                rows={cycleRows}
                selectedJobKey={selectedJobKey}
                onSelectJob={(jobKey) => setSelectedJobKey(jobKey)}
              />
            </TabsContent>
          </Tabs>
        )}

        {selectedJob && !isLoading && !isError && (
          <div className='rounded-md border p-4 space-y-3'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline'>{selectedJob.queue.toUpperCase()}</Badge>
              <Badge className={getStateBadgeClass(selectedJob.state)}>{selectedJob.state}</Badge>
              <span className='text-sm font-medium'>{selectedJob.name}</span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-xs'>
              <div>
                <p className='text-muted-foreground'>Job ID</p>
                <p className='font-mono break-all'>{selectedJob.id}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Attempts</p>
                <p>
                  {selectedJob.attemptsMade} / {selectedJob.attemptsMax}
                </p>
              </div>
              <div>
                <p className='text-muted-foreground'>Created</p>
                <p>{formatDateTime(selectedJob.createdAt)}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Finished</p>
                <p>{formatDateTime(selectedJob.finishedAt)}</p>
              </div>
            </div>

            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>실패 원인</p>
              <p className='text-sm break-all'>{selectedJob.failedReason ?? '-'}</p>
            </div>

            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>데이터 미리보기</p>
              <pre className='rounded-md bg-muted p-3 text-xs overflow-x-auto'>
                {JSON.stringify(selectedJob.dataPreview, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface QueueJobsGridProps {
  rows: DisplayQueueJob[];
  selectedJobKey: string | null;
  onSelectJob: (jobKey: string) => void;
}

function QueueJobsGrid({ rows, selectedJobKey, onSelectJob }: QueueJobsGridProps) {
  if (rows.length === 0) {
    return <div className='rounded-md border p-4 text-center text-muted-foreground'>작업이 없습니다.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Queue</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Attempts</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Finished</TableHead>
          <TableHead>Failed Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((job) => (
          <TableRow
            key={job.rowKey}
            role='button'
            tabIndex={0}
            aria-selected={selectedJobKey === job.rowKey}
            onClick={() => onSelectJob(job.rowKey)}
            className={`cursor-pointer ${selectedJobKey === job.rowKey ? 'bg-muted/60' : ''}`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelectJob(job.rowKey);
              }
            }}
          >
            <TableCell>
              <Badge variant='outline'>{job.queue.toUpperCase()}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={getStateBadgeClass(job.state)}>{job.state}</Badge>
            </TableCell>
            <TableCell>{job.name}</TableCell>
            <TableCell>
              {job.attemptsMade} / {job.attemptsMax}
            </TableCell>
            <TableCell className='text-xs text-muted-foreground'>{formatDateTime(job.createdAt)}</TableCell>
            <TableCell className='text-xs text-muted-foreground'>{formatDateTime(job.finishedAt)}</TableCell>
            <TableCell className='max-w-[260px] truncate text-xs text-muted-foreground' title={job.failedReason ?? ''}>
              {job.failedReason ?? '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
