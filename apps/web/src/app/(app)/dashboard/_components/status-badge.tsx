import type { AvailabilityStatus } from '@workspace/db';

import { STATUS_BADGE_STYLES, STATUS_BADGE_TEXT } from '@/app/(app)/dashboard/_lib/constants';
import type { StatusType } from '@/app/(app)/dashboard/_lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AvailabilityStatus;
  isPaused?: boolean;
}

/**
 * Renders a status Badge reflecting availability and optional paused state.
 *
 * @param status - The availability status to display.
 * @param isPaused - If true, displays `PAUSED` regardless of `status`.
 * @returns A React element containing a styled Badge with the status text.
 */
export function StatusBadge({ status, isPaused }: StatusBadgeProps): React.ReactElement {
  const displayStatus: StatusType = isPaused ? 'PAUSED' : status;

  return (
    <Badge className={cn('border-transparent', STATUS_BADGE_STYLES[displayStatus])}>
      {STATUS_BADGE_TEXT[displayStatus]}
    </Badge>
  );
}
