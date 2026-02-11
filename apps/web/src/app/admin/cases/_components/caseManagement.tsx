'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCasesQuery } from '@/features/admin/cases';

const STATUS_OPTIONS = [
  { value: 'all', label: '전체 상태' },
  { value: 'RECEIVED', label: '접수됨' },
  { value: 'REVIEWING', label: '검토 중' },
  { value: 'NEEDS_CLARIFICATION', label: '명확화 필요' },
  { value: 'WAITING_PAYMENT', label: '결제 대기' },
  { value: 'ACTIVE_MONITORING', label: '모니터링 중' },
  { value: 'CONDITION_MET', label: '조건 충족' },
  { value: 'BILLED', label: '청구됨' },
  { value: 'CLOSED', label: '완료' },
  { value: 'REJECTED', label: '거부' },
  { value: 'EXPIRED', label: '만료' },
  { value: 'CANCELLED', label: '취소' },
] as const;

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  RECEIVED: 'outline',
  REVIEWING: 'secondary',
  NEEDS_CLARIFICATION: 'destructive',
  WAITING_PAYMENT: 'outline',
  ACTIVE_MONITORING: 'default',
  CONDITION_MET: 'default',
  BILLED: 'secondary',
  CLOSED: 'secondary',
  REJECTED: 'destructive',
  EXPIRED: 'outline',
  CANCELLED: 'outline',
};

const SEVERITY_COLORS: Record<string, string> = {
  GREEN: 'bg-green-100 text-green-800',
  AMBER: 'bg-amber-100 text-amber-800',
  RED: 'bg-red-100 text-red-800',
};

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function CaseManagement() {
  const [status, setStatus] = useState('all');
  const router = useRouter();

  const filters = useMemo(() => (status !== 'all' ? { status } : {}), [status]);

  const { data, isLoading, isError } = useCasesQuery(filters);

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h1 className='text-2xl font-bold'>케이스 관리</h1>
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
              <TableHead>ID</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>모호성</TableHead>
              <TableHead>접수일</TableHead>
              <TableHead>최종 변경</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1, 2, 3, 4].map((row) => (
                <TableRow key={`skeleton-row-${row}`}>
                  {[0, 1, 2, 3, 4].map((col) => (
                    <TableCell key={`skeleton-cell-${row}-${col}`}>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className='text-center text-destructive'>
                  데이터를 불러오는 데 실패했습니다
                </TableCell>
              </TableRow>
            )}
            {data?.cases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className='text-center text-muted-foreground'>
                  케이스가 없습니다
                </TableCell>
              </TableRow>
            )}
            {data?.cases.map((c) => (
              <TableRow key={c.id} className='cursor-pointer' onClick={() => router.push(`/admin/cases/${c.id}`)}>
                <TableCell className='font-mono text-xs'>{c.id.slice(0, 8)}...</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[c.status] ?? 'outline'}>{statusLabel(c.status)}</Badge>
                </TableCell>
                <TableCell>
                  {c.ambiguityResult ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[c.ambiguityResult.severity] ?? ''}`}
                    >
                      {c.ambiguityResult.severity}
                    </span>
                  ) : (
                    <span className='text-muted-foreground text-xs'>-</span>
                  )}
                </TableCell>
                <TableCell className='text-sm'>{formatDate(c.createdAt)}</TableCell>
                <TableCell className='text-sm'>{formatDate(c.statusChangedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
