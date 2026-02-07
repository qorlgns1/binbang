'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { Activity, BellRing, Home } from 'lucide-react';

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

export function DashboardContent(): React.ReactElement {
  const { data: session } = useSession();
  const { data: accommodations = [], isPending: accLoading } = useAccommodations();
  const { data: recentLogs = [], isPending: logsLoading } = useRecentLogs();

  const activeCount = accommodations.filter((a) => a.isActive).length;
  const userName = session?.user?.name?.trim();
  const greeting = userName ? `안녕하세요, ${userName}님.` : '안녕하세요.';

  return (
    <>
      {/* Hero Section */}
      <section className='mb-10'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-3xl font-semibold text-foreground md:text-4xl'>
              {greeting}
            </h1>
            <p className='mt-2 text-lg text-muted-foreground'>
              {activeCount > 0
                ? `오늘도 빈방어때가 ${activeCount}곳의 불을 밝혀두었습니다.`
                : '아직 등대가 비출 곳이 없네요. 첫 번째 숙소를 등록해보세요.'}
            </p>
          </div>
          <div className='hidden items-center gap-2 md:flex'>
            <div className='flex size-12 items-center justify-center rounded-full bg-primary/20'>
              <Activity className='size-6 text-primary animate-pulse' />
            </div>
          </div>
        </div>
      </section>

      {/* 플랜 사용량 */}
      <div className='mb-6'>
        <QuotaGauge />
      </div>

      {/* 요약 카드 */}
      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
        <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur transition-all hover:shadow-md'>
          <CardHeader className='pb-2'>
            <CardDescription className='flex items-center gap-2'>
              <Home className='size-4' />
              등록된 숙소
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{accLoading ? '--' : accommodations.length}</p>
          </CardContent>
        </Card>
        <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur transition-all hover:shadow-md'>
          <CardHeader className='pb-2'>
            <CardDescription className='flex items-center gap-2'>
              <Activity className='size-4 text-primary animate-pulse' />
              지금 불을 밝히고 있는 곳
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold text-primary'>
              {accLoading ? '--' : accommodations.filter((a) => a.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur transition-all hover:shadow-md'>
          <CardHeader className='pb-2'>
            <CardDescription className='flex items-center gap-2'>
              <BellRing className='size-4 text-chart-3' />
              예약 가능
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold text-chart-3'>
              {accLoading ? '--' : accommodations.filter((a) => a.lastStatus === 'AVAILABLE').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 숙소 목록 */}
      <Card className='mb-8 border-border/80 bg-card/90 shadow-sm backdrop-blur'>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 border-b'>
          <CardTitle>내 숙소</CardTitle>
          <Button
            asChild
            className='bg-primary text-primary-foreground hover:bg-primary/90'
          >
            <Link href='/accommodations/new'>+ 숙소 추가</Link>
          </Button>
        </CardHeader>

        {accLoading ? (
          <CardContent className='p-12 text-center text-muted-foreground'>불러오는 중...</CardContent>
        ) : accommodations.length === 0 ? (
          <CardContent className='p-16 text-center'>
            <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10'>
              <Home className='size-8 text-primary' />
            </div>
            <p className='mb-2 text-lg font-medium text-foreground'>아직 등대가 비출 곳이 없네요</p>
            <p className='mb-6 text-sm text-muted-foreground'>첫 번째 숙소를 등록하고 빈방 소식을 받아보세요</p>
            <Button
              asChild
              className='bg-primary text-primary-foreground hover:bg-primary/90'
            >
              <Link href='/accommodations/new'>첫 번째 숙소 등록하기</Link>
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
      <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
        <CardHeader className='border-b'>
          <CardTitle>최근 발견한 빈방 소식</CardTitle>
        </CardHeader>

        {logsLoading ? (
          <CardContent className='p-12 text-center text-muted-foreground'>불러오는 중...</CardContent>
        ) : recentLogs.length === 0 ? (
          <CardContent className='p-12 text-center text-muted-foreground'>
            아직 발견한 빈방 소식이 없습니다
          </CardContent>
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
