import { Bell } from 'lucide-react';

import { STATUS_DOT_STYLES } from '@/app/(app)/dashboard/_lib/constants';
import { cn } from '@/lib/utils';
import type { RecentLog } from '@/types/accommodation';

interface EventRowProps {
  event: RecentLog;
  isLast: boolean;
}

/**
 * Render a horizontal timeline row for a single recent event in the dashboard.
 *
 * @param event - The RecentLog to display; used for status (dot), accommodation name, optional price, creation time, and notification indicator.
 * @param isLast - Whether this row is the last in the list; when true the vertical timeline connector after the status dot is omitted.
 * @returns A React element representing the timeline row for the provided event.
 */
export function EventRow({ event, isLast }: EventRowProps): React.ReactElement {
  return (
    <div className='flex gap-4 px-6'>
      {/* Timeline indicator */}
      <div className='relative flex flex-col items-center pt-4'>
        <div className={cn('size-2.5 shrink-0 rounded-full', STATUS_DOT_STYLES[event.status])} />
        {!isLast && <div className='absolute top-[26px] bottom-0 w-px bg-border' />}
      </div>

      {/* Content */}
      <div className='flex min-h-[56px] flex-1 items-center gap-4 py-3'>
        <span className='min-w-0 flex-1 truncate text-sm'>{event.accommodation.name}</span>
        {event.price && (
          <span className='shrink-0 text-sm font-medium tabular-nums text-muted-foreground'>{event.price}</span>
        )}
        <span className='shrink-0 text-xs text-muted-foreground'>{getRelativeTime(event.createdAt)}</span>
        {event.notificationSent && <Bell className='size-4 shrink-0 text-chart-3' />}
      </div>
    </div>
  );
}

// ============================================================================
// Relative Time Helper
/**
 * Format a timestamp into a Korean relative time string.
 *
 * @param date - The time to format, provided as a `Date` or an ISO/parsable date string.
 * @returns A Korean relative time such as `방금 전`, `5분 전`, `2시간 전`, `3일 전`, or a locale date string for dates 7+ days old.
 */

function getRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return '-';
  const diffMin = Math.floor((now - then) / 60_000);

  if (diffMin < 0) return '곧';
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(date).toLocaleDateString('ko-KR');
}
