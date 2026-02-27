import Link from 'next/link';

import { AlertTriangle, ExternalLink, Pencil } from 'lucide-react';

import { STATUS_DOT_STYLES } from '@/app/(app)/dashboard/_lib/constants';
import { isProblemStatus, resolveUnknownStatusText, toUserFacingErrorMessage } from '@/app/(app)/dashboard/_lib/status';
import type { StatusType } from '@/app/(app)/dashboard/_lib/types';
import { LocalDateTime } from '@/components/LocalDateTime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Accommodation } from '@/types/accommodation';

import { StatusBadge } from './StatusBadge';

interface AccommodationRowProps {
  accommodation: Accommodation;
}

/**
 * Renders a single accommodation row showing its name, platform, status, dates, last check time, and action links.
 *
 * Displays a status dot (uses 'PAUSED' when the accommodation is inactive), a platform badge, a StatusBadge reflecting the last status, the check-in/check-out date range, an optional last check timestamp, and buttons linking to the accommodation detail and edit pages.
 *
 * @param accommodation - The accommodation record containing `id`, `name`, `platform`, `checkIn`, `checkOut`, `lastCheck`, `lastStatus`, and `isActive`.
 * @returns A React element representing the accommodation row.
 */
export function AccommodationRow({ accommodation }: AccommodationRowProps): React.ReactElement {
  const {
    id,
    name,
    platform,
    checkIn,
    checkOut,
    lastCheck,
    lastPolledAt,
    lastStatus,
    lastEventAt,
    lastErrorMessage,
    lastErrorAt,
    isActive,
    platformId,
  } = accommodation;
  const displayStatus: StatusType = !isActive ? 'PAUSED' : lastStatus;
  // Agoda API 방식(platformId 존재)은 lastPolledAt을, 스크래핑 방식은 lastCheck를 표시한다.
  // 동일 컴포넌트에서 두 데이터 소스를 함께 표현해야 하므로 렌더 시점에 통합해서 계산한다.
  const lastActivity = platformId ? lastPolledAt : lastCheck;
  const lastActivityLabel = platformId ? '마지막 폴링' : '마지막 체크';
  const hasProblem = isActive && isProblemStatus({ lastStatus, platformId, lastPolledAt, lastCheck, lastEventAt });
  const unknownLabel =
    lastStatus === 'UNKNOWN'
      ? resolveUnknownStatusText({ lastStatus, platformId, lastPolledAt, lastCheck, lastEventAt })
      : undefined;
  const userErrorReason = lastErrorMessage ? toUserFacingErrorMessage(lastErrorMessage) : null;
  const today = new Date().toISOString().split('T')[0];
  const isCheckInExpired = checkIn.split('T')[0] < today;

  return (
    <div
      data-testid='accommodation-row'
      className={cn(
        'flex min-h-[72px] items-center gap-4 px-6 py-4 transition-colors duration-140 ease-out hover:bg-muted/50',
        hasProblem && isActive && 'bg-destructive/5',
      )}
    >
      {/* row 단위 test id: e2e에서 특정 숙소 행을 안정적으로 찾기 위한 기준점 */}
      {/* 상태 도트 */}
      <div className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT_STYLES[displayStatus])} />

      <div className='min-w-0 flex-1'>
        <div className='mb-1 flex flex-wrap items-center gap-2'>
          <h3 className='truncate text-sm font-medium' data-testid='accommodation-row-name'>
            {name}
          </h3>
          <Badge variant='outline' className='text-xs'>
            {platform}
          </Badge>
          <StatusBadge status={lastStatus} isPaused={!isActive} unknownLabel={unknownLabel} />
        </div>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
          <span className={cn(isCheckInExpired && 'text-destructive')}>
            {isCheckInExpired && <AlertTriangle className='mr-1 inline size-3' />}
            {checkIn.split('T')[0]} ~ {checkOut.split('T')[0]}
          </span>
          {lastActivity && (
            <span>
              {lastActivityLabel}: <LocalDateTime date={lastActivity} />
            </span>
          )}
        </div>
        {lastStatus === 'ERROR' && userErrorReason && (
          <div className='mt-1 text-xs text-destructive'>
            오류 사유: {userErrorReason}
            {lastErrorAt ? (
              <span className='ml-1 text-muted-foreground'>
                (<LocalDateTime date={lastErrorAt} />)
              </span>
            ) : null}
          </div>
        )}
      </div>
      <div className='flex shrink-0 items-center gap-1'>
        <Button asChild variant='ghost' size='sm'>
          {/* 상세보기 링크 test id: DOM 깊이 의존 locator 대신 직접 선택 */}
          <Link href={`/accommodations/${id}`} data-testid='accommodation-row-detail-link'>
            <ExternalLink className='size-4' />
            <span className='sr-only md:not-sr-only'>상세보기</span>
          </Link>
        </Button>
        <Button asChild variant='ghost' size='sm'>
          <Link href={`/accommodations/${id}/edit`}>
            <Pencil className='size-4' />
            <span className='sr-only md:not-sr-only'>수정</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
