'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JobItem, JobState } from '@/types/bullmq';
import { useJobsQuery } from '../_hooks/useJobsQuery';
import { JobDetailDialog } from './JobDetailDialog';

interface JobsTableProps {
  queueName: string;
  refreshTick: number;
}

const STATES: { value: JobState; label: string }[] = [
  { value: 'failed', label: 'Failed' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
];

function formatTs(ts: number | null): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('ko-KR', { hour12: false });
}

function stateBadgeVariant(state: JobState): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (state === 'failed') return 'destructive';
  if (state === 'active') return 'default';
  if (state === 'completed') return 'secondary';
  return 'outline';
}

/** SRP: 선택 상태 관리를 독립 컴포넌트 내부 책임으로 명확히 분리 */
function useJobSelection(jobs: JobItem[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleAll() {
    setSelected(selected.size === jobs.length ? new Set() : new Set(jobs.map((j) => j.id)));
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return { selected, toggleAll, toggleOne, clearSelection };
}

export function JobsTable({ queueName, refreshTick }: JobsTableProps) {
  const [state, setState] = useState<JobState>('failed');
  const [page, setPage] = useState(1);
  const [detailJobId, setDetailJobId] = useState<string | null>(null);

  const { result, loading, error, bulkLoading, refetch, executeBulk } = useJobsQuery(
    queueName,
    state,
    page,
    refreshTick,
  );

  const jobs = result?.jobs ?? [];
  const { selected, toggleAll, toggleOne, clearSelection } = useJobSelection(jobs);

  function handleStateChange(newState: string) {
    setState(newState as JobState);
    setPage(1);
    clearSelection();
  }

  async function handleBulk(action: 'retry' | 'remove') {
    await executeBulk(action, [...selected]);
    clearSelection();
  }

  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className='space-y-3'>
      <Tabs value={state} onValueChange={handleStateChange}>
        <TabsList>
          {STATES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && <p className='text-sm text-destructive'>{error}</p>}

      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {loading ? '로딩 중...' : `총 ${total.toLocaleString()}개`}
          {selected.size > 0 && <span className='ml-2 font-medium text-foreground'>{selected.size}개 선택됨</span>}
        </p>
        {selected.size > 0 && (
          <div className='flex gap-2'>
            {state === 'failed' && (
              <Button
                size='sm'
                variant='outline'
                disabled={bulkLoading}
                onClick={() => {
                  void handleBulk('retry');
                }}
              >
                선택 재시도
              </Button>
            )}
            <Button
              size='sm'
              variant='destructive'
              disabled={bulkLoading}
              onClick={() => {
                void handleBulk('remove');
              }}
            >
              선택 삭제
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-10'>
              <Checkbox
                checked={jobs.length > 0 && selected.size === jobs.length}
                onCheckedChange={toggleAll}
                aria-label='전체 선택'
              />
            </TableHead>
            <TableHead>ID / Name</TableHead>
            <TableHead>State</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Failed Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className='text-center text-sm text-muted-foreground'>
                {loading ? '로딩 중...' : '잡이 없습니다.'}
              </TableCell>
            </TableRow>
          ) : (
            jobs.map((job) => (
              <TableRow
                key={job.id}
                className='cursor-pointer hover:bg-muted/50'
                onClick={() => setDetailJobId(job.id)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(job.id)}
                    onCheckedChange={() => toggleOne(job.id)}
                    aria-label={`선택 ${job.id}`}
                  />
                </TableCell>
                <TableCell>
                  <p className='font-mono text-xs'>{job.id}</p>
                  <p className='text-xs text-muted-foreground'>{job.name}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={stateBadgeVariant(job.state)}>{job.state}</Badge>
                </TableCell>
                <TableCell className='text-xs'>{job.attemptsMade}</TableCell>
                <TableCell className='text-xs text-muted-foreground'>{formatTs(job.timestamp)}</TableCell>
                <TableCell className='max-w-xs truncate text-xs text-muted-foreground'>
                  {job.failedReason ?? '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className='flex items-center justify-between text-sm'>
          <Button variant='outline' size='sm' disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            이전
          </Button>
          <span className='text-muted-foreground'>
            {page} / {totalPages}
          </span>
          <Button variant='outline' size='sm' disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            다음
          </Button>
        </div>
      )}

      <JobDetailDialog
        queueName={queueName}
        jobId={detailJobId}
        onClose={() => setDetailJobId(null)}
        onMutated={refetch}
      />
    </div>
  );
}
