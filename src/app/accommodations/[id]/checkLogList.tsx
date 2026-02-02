'use client';

import { LocalDateTime } from '@/components/LocalDateTime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCheckLogs } from '@/hooks/useCheckLogs';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-status-success text-status-success-foreground border-transparent',
  UNAVAILABLE: 'bg-status-error text-status-error-foreground border-transparent',
  ERROR: 'bg-status-warning text-status-warning-foreground border-transparent',
  UNKNOWN: 'bg-status-neutral text-status-neutral-foreground border-transparent',
};

const statusText: Record<string, string> = {
  AVAILABLE: '예약 가능',
  UNAVAILABLE: '예약 불가',
  ERROR: '오류',
  UNKNOWN: '확인 중',
};

export function CheckLogList({ accommodationId }: { accommodationId: string }) {
  const { data, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useCheckLogs(accommodationId);

  const allLogs = data?.pages.flatMap((page) => page.logs) ?? [];

  return (
    <Card>
      <CardHeader className='border-b'>
        <CardTitle>체크 로그</CardTitle>
      </CardHeader>

      {isPending ? (
        <CardContent className='p-12 text-center text-muted-foreground'>불러오는 중...</CardContent>
      ) : allLogs.length === 0 ? (
        <CardContent className='p-12 text-center text-muted-foreground'>아직 체크 로그가 없습니다</CardContent>
      ) : (
        <>
          <div className='divide-y'>
            {allLogs.map((log) => (
              <div
                key={log.id}
                className='p-4 flex items-center gap-4'
              >
                <Badge className={statusColors[log.status] ?? statusColors.UNKNOWN}>
                  {statusText[log.status] ?? statusText.UNKNOWN}
                </Badge>
                <span className='flex-1 text-sm'>
                  {log.price && `${log.price}`}
                  {log.errorMessage && <span className='text-destructive ml-2'>{log.errorMessage}</span>}
                </span>
                <LocalDateTime
                  date={log.createdAt}
                  className='text-xs text-muted-foreground'
                />
                {log.notificationSent && <span className='text-xs text-status-success-foreground'>📱</span>}
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className='p-4 text-center border-t'>
              <Button
                variant='ghost'
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? '불러오는 중...' : '더 보기'}
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
