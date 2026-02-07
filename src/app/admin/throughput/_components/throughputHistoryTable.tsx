'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useThroughputHistory } from '@/hooks/useThroughputHistory';

interface Props {
  filters: { from?: string; to?: string };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ThroughputHistoryTable({ filters }: Props) {
  const { data, isLoading } = useThroughputHistory(filters);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-32' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-[200px] w-full' />
        </CardContent>
      </Card>
    );
  }

  const buckets = data?.buckets ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>시간대별 체크 현황</CardTitle>
      </CardHeader>
      <CardContent>
        {buckets.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground'>해당 기간에 데이터가 없습니다.</div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시간</TableHead>
                  <TableHead className='text-right'>총 체크</TableHead>
                  <TableHead className='text-right'>성공</TableHead>
                  <TableHead className='text-right'>에러</TableHead>
                  <TableHead className='text-right'>처리량/분</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buckets.map((bucket) => (
                  <TableRow key={bucket.bucketStart}>
                    <TableCell className='whitespace-nowrap'>{formatDateTime(bucket.bucketStart)}</TableCell>
                    <TableCell className='text-right'>{bucket.totalChecks}</TableCell>
                    <TableCell className='text-right text-status-success-foreground'>{bucket.successCount}</TableCell>
                    <TableCell className='text-right text-status-error-foreground'>
                      {bucket.errorCount > 0 ? bucket.errorCount : '-'}
                    </TableCell>
                    <TableCell className='text-right font-mono'>{bucket.throughputPerMin}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
