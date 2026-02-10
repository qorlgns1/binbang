import type { AvailabilityStatus } from '@workspace/db';

import { STATUS_BADGE_STYLES, STATUS_BADGE_TEXT } from '@/app/(app)/dashboard/_lib/constants';
import type { StatusType } from '@/app/(app)/dashboard/_lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AvailabilityStatus;
  isPaused?: boolean;
}

export function StatusBadge({ status, isPaused }: StatusBadgeProps): React.ReactElement {
  const displayStatus: StatusType = isPaused ? 'PAUSED' : status;

  return (
    <Badge className={cn('border-transparent', STATUS_BADGE_STYLES[displayStatus])}>
      {STATUS_BADGE_TEXT[displayStatus]}
    </Badge>
  );
}
