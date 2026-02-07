'use client';

import Link from 'next/link';

import { LocalDateTime } from '@/components/LocalDateTime';
import { QuotaGauge } from '@/components/quota-gauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccommodations } from '@/hooks/useAccommodations';
import { useRecentLogs } from '@/hooks/useRecentLogs';

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

export function DashboardContent() {
  const { data: accommodations = [], isPending: accLoading } = useAccommodations();
  const { data: recentLogs = [], isPending: logsLoading } = useRecentLogs();

  return (
    <>
      {/* 플랜 사용량 */}
      <div className='mb-6'>
        <QuotaGauge />
      </div>

      {/* 요약 카드 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>등록된 숙소</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{accLoading ? '--' : accommodations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>모니터링 중</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold text-status-success-foreground'>
              {accLoading ? '--' : accommodations.filter((a) => a.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>예약 가능</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold text-primary'>
              {accLoading ? '--' : accommodations.filter((a) => a.lastStatus === 'AVAILABLE').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 숙소 목록 */}
      <Card className='mb-8'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 border-b'>
          <CardTitle>내 숙소</CardTitle>
          <Button asChild>
            <Link href='/accommodations/new'>+ 숙소 추가</Link>
          </Button>
        </CardHeader>

        {accLoading ? (
          <CardContent className='p-12 text-center text-muted-foreground'>불러오는 중...</CardContent>
        ) : accommodations.length === 0 ? (
          <CardContent className='p-12 text-center text-muted-foreground'>
            <p className='mb-4'>등록된 숙소가 없습니다</p>
            <Button
              asChild
              variant='link'
              className='px-0'
            >
              <Link href='/accommodations/new'>첫 번째 숙소를 등록해보세요</Link>
            </Button>
          </CardContent>
        ) : (
          <div className='divide-y'>
            {accommodations.map((acc) => (
              <div
                key={acc.id}
                className='p-6 flex items-center justify-between hover:bg-muted/50'
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-1'>
                    <h3 className='font-medium'>{acc.name}</h3>
                    <Badge className={statusColors[acc.lastStatus] ?? statusColors.UNKNOWN}>
                      {statusText[acc.lastStatus] ?? statusText.UNKNOWN}
                    </Badge>
                    {!acc.isActive && <Badge variant='secondary'>일시정지</Badge>}
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {acc.platform} · {acc.checkIn.split('T')[0]} ~ {acc.checkOut.split('T')[0]}
                    {acc.lastPrice && ` · ${acc.lastPrice}`}
                  </p>
                  {acc.lastCheck && (
                    <p className='text-xs text-muted-foreground mt-1'>
                      마지막 체크: <LocalDateTime date={acc.lastCheck} />
                    </p>
                  )}
                </div>
                <Button
                  asChild
                  variant='link'
                  className='px-0 text-sm'
                >
                  <Link href={`/accommodations/${acc.id}`}>상세보기</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 최근 로그 */}
      <Card>
        <CardHeader className='border-b'>
          <CardTitle>최근 체크 로그</CardTitle>
        </CardHeader>

        {logsLoading ? (
          <CardContent className='p-12 text-center text-muted-foreground'>불러오는 중...</CardContent>
        ) : recentLogs.length === 0 ? (
          <CardContent className='p-12 text-center text-muted-foreground'>아직 체크 로그가 없습니다</CardContent>
        ) : (
          <div className='divide-y'>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className='p-4 flex items-center gap-4'
              >
                <Badge className={statusColors[log.status] ?? statusColors.UNKNOWN}>
                  {statusText[log.status] ?? statusText.UNKNOWN}
                </Badge>
                <span className='flex-1 text-sm'>
                  {log.accommodation.name}
                  {log.price && ` · ${log.price}`}
                </span>
                <LocalDateTime
                  date={log.createdAt}
                  className='text-xs text-muted-foreground'
                />
                {log.notificationSent && <span className='text-xs text-status-success-foreground'>📱 알림 전송됨</span>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
