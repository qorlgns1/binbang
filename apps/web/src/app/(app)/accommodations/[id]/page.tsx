import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { buildAccommodationUrl } from '@workspace/shared';
import { ArrowLeft, Calendar, ExternalLink, Users } from 'lucide-react';

import { LocalDateTime } from '@/components/LocalDateTime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { PageParams } from '@/types/api';

import { PriceTrendSection } from './_components/priceTrendSection';
import { DeleteButton, ToggleActiveButton } from './actions';
import { CheckLogList } from './checkLogList';

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

export const metadata = {
  title: '숙소 상세',
  description: '등록된 숙소의 모니터링 현황 상세 정보',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccommodationDetailPage({ params }: PageParams): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) redirect('/login');

  const accommodation = await prisma.accommodation.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!accommodation) notFound();

  return (
    <main className='mx-auto max-w-4xl px-4 py-8'>
      {/* 뒤로 가기 */}
      <div className='mb-6'>
        <Button
          asChild
          variant='ghost'
          size='sm'
          className='gap-2 px-0 text-muted-foreground hover:text-foreground'
        >
          <Link href='/dashboard'>
            <ArrowLeft className='size-4' />
            대시보드로 돌아가기
          </Link>
        </Button>
      </div>

      {/* 히어로 섹션 */}
      <div className='mb-8'>
        <div className='mb-4 flex flex-wrap items-center gap-3'>
          <h1 className='text-3xl font-semibold text-foreground'>{accommodation.name}</h1>
          <Badge className={statusColors[accommodation.lastStatus] ?? statusColors.UNKNOWN}>
            {statusText[accommodation.lastStatus] ?? statusText.UNKNOWN}
          </Badge>
          {!accommodation.isActive && (
            <Badge
              variant='secondary'
              className='border-border'
            >
              일시정지
            </Badge>
          )}
        </div>
        <p className='text-muted-foreground'>{accommodation.platform}</p>
      </div>

      {/* 액션 버튼 그룹 */}
      <div className='mb-8 flex flex-wrap gap-3'>
        <Button
          asChild
          className='bg-primary text-primary-foreground hover:bg-primary/90'
        >
          <Link href={`/accommodations/${accommodation.id}/edit`}>수정</Link>
        </Button>
        <ToggleActiveButton
          id={accommodation.id}
          isActive={accommodation.isActive}
        />
        <DeleteButton id={accommodation.id} />
      </div>

      {/* 숙소 정보 카드 */}
      <Card className='mb-8 border-border/80 bg-card/90 shadow-sm backdrop-blur'>
        <CardHeader>
          <CardTitle>숙소 정보</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-6 sm:grid-cols-2'>
          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <ExternalLink className='size-4' />
              <span>URL</span>
            </div>
            <a
              href={buildAccommodationUrl(accommodation)}
              target='_blank'
              rel='noopener noreferrer'
              className='break-all text-sm text-primary transition-colors hover:text-primary/80 hover:underline'
            >
              {buildAccommodationUrl(accommodation)}
            </a>
          </div>

          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Users className='size-4' />
              <span>인원</span>
            </div>
            <p className='text-sm font-medium text-foreground'>{accommodation.adults}명</p>
          </div>

          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='size-4' />
              <span>체크인</span>
            </div>
            <p className='text-sm font-medium text-foreground'>{accommodation.checkIn.toISOString().split('T')[0]}</p>
          </div>

          <div className='space-y-1'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='size-4' />
              <span>체크아웃</span>
            </div>
            <p className='text-sm font-medium text-foreground'>{accommodation.checkOut.toISOString().split('T')[0]}</p>
          </div>

          {accommodation.lastPrice && (
            <div className='space-y-1'>
              <div className='text-sm text-muted-foreground'>마지막 확인 가격</div>
              <p className='text-lg font-semibold text-primary'>{accommodation.lastPrice}</p>
            </div>
          )}

          {accommodation.lastCheck && (
            <div className='space-y-1'>
              <div className='text-sm text-muted-foreground'>마지막 체크</div>
              <p className='text-sm font-medium text-foreground'>
                <LocalDateTime date={accommodation.lastCheck} />
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 가격 분석 */}
      <div className='mb-8'>
        <PriceTrendSection accommodationId={accommodation.id} />
      </div>

      {/* 체크 로그 */}
      <CheckLogList accommodationId={accommodation.id} />
    </main>
  );
}
