import Link from 'next/link';

import { AlertTriangle, ExternalLink, Pencil } from 'lucide-react';

import { STATUS_DOT_STYLES } from '@/app/(app)/dashboard/_lib/constants';
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
  const { id, name, platform, checkIn, checkOut, lastCheck, lastPolledAt, lastStatus, isActive, platformId } =
    accommodation;
  const displayStatus: StatusType = !isActive ? 'PAUSED' : lastStatus;
  // Agoda API 방식 (platformId 있음) → lastPolledAt 사용, 스크래핑 방식 → lastCheck 사용
  const lastActivity = platformId ? lastPolledAt : lastCheck;
  const lastActivityLabel = platformId ? '마지막 폴링' : '마지막 체크';
  const hasProblem = lastStatus === 'ERROR' || lastStatus === 'UNKNOWN';
  const today = new Date().toISOString().split('T')[0];
  const isCheckInExpired = checkIn.split('T')[0] < today;

  return (
    <div
      className={cn(
        'flex min-h-[72px] items-center gap-4 px-6 py-4 transition-colors duration-140 ease-out hover:bg-muted/50',
        hasProblem && isActive && 'bg-destructive/5',
      )}
    >
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
          <StatusBadge status={lastStatus} isPaused={!isActive} />
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
      </div>
      <div className='flex shrink-0 items-center gap-1'>
        <Button asChild variant='ghost' size='sm'>
          <Link href={`/accommodations/${id}`}>
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
