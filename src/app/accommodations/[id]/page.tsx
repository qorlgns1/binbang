import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { LocalDateTime } from '@/components/LocalDateTime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { DeleteButton, ToggleActiveButton } from './actions';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 border-transparent',
  UNAVAILABLE: 'bg-rose-100 text-rose-700 border-transparent',
  ERROR: 'bg-amber-100 text-amber-700 border-transparent',
  UNKNOWN: 'bg-slate-100 text-slate-700 border-transparent',
};

const statusText: Record<string, string> = {
  AVAILABLE: '예약 가능',
  UNAVAILABLE: '예약 불가',
  ERROR: '오류',
  UNKNOWN: '확인 중',
};

function getStatusColor(status: string): string {
  return statusColors[status] ?? statusColors.UNKNOWN;
}

function getStatusLabel(status: string): string {
  return statusText[status] ?? statusText.UNKNOWN;
}

interface CheckLogItem {
  id: string;
  status: string;
  price: string | null;
  errorMessage: string | null;
  notificationSent: boolean;
  createdAt: Date;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AccommodationDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    redirect('/login');
  }

  const accommodation = await prisma.accommodation.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      checkLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!accommodation) {
    notFound();
  }

  return (
    <div className='min-h-screen bg-muted/40'>
      <header className='bg-background/80 backdrop-blur-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <Link
            href='/dashboard'
            className='text-muted-foreground hover:text-foreground'
          >
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </header>

      <main className='max-w-4xl mx-auto px-4 py-8'>
        {/* 숙소 정보 카드 */}
        <Card className='mb-8 gap-6'>
          <CardHeader className='flex flex-row items-start justify-between gap-6 space-y-0'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <CardTitle className='text-2xl'>{accommodation.name}</CardTitle>
                <Badge className={getStatusColor(accommodation.lastStatus)}>
                  {getStatusLabel(accommodation.lastStatus)}
                </Badge>
              </div>
              <p className='text-muted-foreground'>{accommodation.platform}</p>
            </div>
            <div>
              <div className='flex gap-2'>
                <Button
                  asChild
                  variant='outline'
                >
                  <Link href={`/accommodations/${accommodation.id}/edit`}>수정</Link>
                </Button>
                <ToggleActiveButton
                  id={accommodation.id}
                  isActive={accommodation.isActive}
                />
                <DeleteButton id={accommodation.id} />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className='grid grid-cols-2 gap-6'>
              <div>
                <h3 className='text-sm text-muted-foreground mb-1'>URL</h3>
                <a
                  href={accommodation.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline break-all'
                >
                  {accommodation.url}
                </a>
              </div>
              <div>
                <h3 className='text-sm text-muted-foreground mb-1'>인원</h3>
                <p>{accommodation.adults}명</p>
              </div>
              <div>
                <h3 className='text-sm text-muted-foreground mb-1'>체크인</h3>
                <p>{accommodation.checkIn.toISOString().split('T')[0]}</p>
              </div>
              <div>
                <h3 className='text-sm text-muted-foreground mb-1'>체크아웃</h3>
                <p>{accommodation.checkOut.toISOString().split('T')[0]}</p>
              </div>
              {accommodation.lastPrice && (
                <div>
                  <h3 className='text-sm text-muted-foreground mb-1'>마지막 확인 가격</h3>
                  <p className='text-lg font-semibold'>{accommodation.lastPrice}</p>
                </div>
              )}
              {accommodation.lastCheck && (
                <div>
                  <h3 className='text-sm text-muted-foreground mb-1'>마지막 체크</h3>
                  <p>
                    <LocalDateTime date={accommodation.lastCheck} />
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 체크 로그 */}
        <Card>
          <CardHeader className='border-b'>
            <CardTitle>체크 로그</CardTitle>
          </CardHeader>

          {accommodation.checkLogs.length === 0 ? (
            <CardContent className='p-12 text-center text-muted-foreground'>아직 체크 로그가 없습니다</CardContent>
          ) : (
            <div className='divide-y max-h-96 overflow-y-auto'>
              {accommodation.checkLogs.map((log: CheckLogItem) => (
                <div
                  key={log.id}
                  className='p-4 flex items-center gap-4'
                >
                  <Badge className={getStatusColor(log.status)}>{getStatusLabel(log.status)}</Badge>
                  <span className='flex-1 text-sm'>
                    {log.price && `${log.price}`}
                    {log.errorMessage && <span className='text-rose-500 ml-2'>{log.errorMessage}</span>}
                  </span>
                  <LocalDateTime
                    date={log.createdAt}
                    className='text-xs text-muted-foreground'
                  />
                  {log.notificationSent && <span className='text-xs text-emerald-600'>📱</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
