'use client';

import { Fragment, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCreateCaseMutation } from '@/features/admin/cases';
import { type SubmissionItem, useSubmissionsQuery } from '@/features/admin/submissions';

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS = [
  { value: 'all', label: '전체 상태' },
  { value: 'RECEIVED', label: '접수됨' },
  { value: 'NEEDS_REVIEW', label: '검토 필요' },
  { value: 'PROCESSED', label: '처리됨' },
  { value: 'REJECTED', label: '거부됨' },
] as const;

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  RECEIVED: 'outline',
  NEEDS_REVIEW: 'secondary',
  PROCESSED: 'default',
  REJECTED: 'destructive',
};

// ============================================================================
// Helpers
// ============================================================================

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function canCreateCase(submission: SubmissionItem): boolean {
  if (submission.status === 'PROCESSED' || submission.status === 'REJECTED') {
    return false;
  }

  return submission.extractedFields != null;
}

// ============================================================================
// Detail Panel
// ============================================================================

function SubmissionDetail({ submission }: { submission: SubmissionItem }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className='bg-muted/50 p-4'>
        <div className='space-y-3 text-sm'>
          {submission.rejectionReason && (
            <div>
              <span className='font-medium text-destructive'>거부 사유: </span>
              <span>{submission.rejectionReason}</span>
            </div>
          )}
          <div>
            <span className='font-medium'>Raw Payload:</span>
            <pre className='mt-1 max-h-64 overflow-auto rounded bg-muted p-3 text-xs'>
              {JSON.stringify(submission.rawPayload, null, 2)}
            </pre>
          </div>
          {submission.extractedFields != null ? (
            <div>
              <span className='font-medium'>Extracted Fields:</span>
              <pre className='mt-1 max-h-48 overflow-auto rounded bg-muted p-3 text-xs'>
                {JSON.stringify(submission.extractedFields, null, 2)}
              </pre>
            </div>
          ) : null}
          <div className='flex flex-wrap gap-4 text-xs text-muted-foreground'>
            <span>ID: {submission.id}</span>
            <span>Source IP: {submission.sourceIp ?? '-'}</span>
            <span>Form Version: {submission.formVersion ?? '-'}</span>
            <span>생성: {formatDate(submission.createdAt)}</span>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================================
// Component
// ============================================================================

export function SubmissionManagement() {
  const [status, setStatus] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creatingSubmissionId, setCreatingSubmissionId] = useState<string | null>(null);

  const filters = useMemo(() => (status !== 'all' ? { status } : {}), [status]);
  const { data, isLoading, isError, refetch } = useSubmissionsQuery(filters);
  const createCaseMutation = useCreateCaseMutation();

  function toggleRow(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleCreateCase(submissionId: string): Promise<void> {
    try {
      setCreatingSubmissionId(submissionId);
      const result = await createCaseMutation.mutateAsync({ submissionId });
      await refetch();
      alert(`케이스를 생성했습니다. (${result.case.id})`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '케이스 생성에 실패했습니다');
    } finally {
      setCreatingSubmissionId(null);
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h1 className='text-2xl font-bold'>폼 제출 관리</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data?.total !== undefined && <p className='text-sm text-muted-foreground'>총 {data.total}건</p>}

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Response ID</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>거부 사유</TableHead>
              <TableHead>접수일</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className='text-right'>액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1, 2, 3, 4].map((row) => (
                <TableRow key={`skeleton-row-${row}`}>
                  {[0, 1, 2, 3, 4, 5].map((col) => (
                    <TableCell key={`skeleton-cell-${row}-${col}`}>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className='text-center text-destructive'>
                  데이터를 불러오는 데 실패했습니다
                </TableCell>
              </TableRow>
            )}
            {data?.submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className='text-center text-muted-foreground'>
                  제출 내역이 없습니다
                </TableCell>
              </TableRow>
            )}
            {data?.submissions.map((s) => (
              <Fragment key={s.id}>
                <TableRow className='cursor-pointer' onClick={() => toggleRow(s.id)}>
                  <TableCell className='font-mono text-xs'>{s.responseId}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status] ?? 'outline'}>{statusLabel(s.status)}</Badge>
                  </TableCell>
                  <TableCell className='max-w-xs truncate text-xs text-muted-foreground'>
                    {s.rejectionReason ?? '-'}
                  </TableCell>
                  <TableCell className='text-sm'>{formatDate(s.receivedAt)}</TableCell>
                  <TableCell className='font-mono text-xs'>{s.sourceIp ?? '-'}</TableCell>
                  <TableCell className='text-right'>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      disabled={!canCreateCase(s) || creatingSubmissionId === s.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleCreateCase(s.id);
                      }}
                    >
                      {creatingSubmissionId === s.id ? '생성 중...' : 'Case 생성'}
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedId === s.id && <SubmissionDetail submission={s} />}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
