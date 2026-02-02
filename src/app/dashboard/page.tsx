import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { LocalDateTime } from '@/components/LocalDateTime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { KakaoAlertBanner } from './kakao-alert-banner';
import { LogoutButton } from './logout-button';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // 사용자 정보 조회 (카카오 토큰 여부 확인)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      kakaoAccessToken: true,
    },
  });

  const hasKakaoToken = !!user?.kakaoAccessToken;

  // 사용자의 숙소 목록 조회
  const accommodations = await prisma.accommodation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  // 최근 로그 조회
  const recentLogs = await prisma.checkLog.findMany({
    where: { userId: session.user.id },
    include: { accommodation: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const statusColors = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 border-transparent',
    UNAVAILABLE: 'bg-rose-100 text-rose-700 border-transparent',
    ERROR: 'bg-amber-100 text-amber-700 border-transparent',
    UNKNOWN: 'bg-slate-100 text-slate-700 border-transparent',
  };

  const statusText = {
    AVAILABLE: '예약 가능',
    UNAVAILABLE: '예약 불가',
    ERROR: '오류',
    UNKNOWN: '확인 중',
  };

  return (
    <div className='min-h-screen bg-muted/40'>
      {/* 헤더 */}
      <header className='bg-background/80 backdrop-blur-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 py-4 flex items-center justify-between'>
          <h1 className='text-xl font-bold'>🏨 숙소 모니터링</h1>
          <div className='flex items-center gap-4'>
            <span className='text-muted-foreground'>{session.user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 py-8'>
        {/* 카카오톡 알림 배너 (Google 로그인 사용자에게만 표시) */}
        {!hasKakaoToken && <KakaoAlertBanner />}

        {/* 요약 카드 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>등록된 숙소</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold'>{accommodations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>모니터링 중</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-emerald-600'>
                {accommodations.filter((a) => a.isActive).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription>예약 가능</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-3xl font-bold text-primary'>
                {accommodations.filter((a) => a.lastStatus === 'AVAILABLE').length}
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

          {accommodations.length === 0 ? (
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
                      {!acc.isActive && (
                        <Badge variant='secondary'>일시정지</Badge>
                      )}
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      {acc.platform} · {acc.checkIn.toISOString().split('T')[0]} ~{' '}
                      {acc.checkOut.toISOString().split('T')[0]}
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

          {recentLogs.length === 0 ? (
            <CardContent className='p-12 text-center text-muted-foreground'>
              아직 체크 로그가 없습니다
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
                  {log.notificationSent && <span className='text-xs text-emerald-600'>📱 알림 전송됨</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
