'use client';

import Image from 'next/image';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowRight, Check, Home, Shield, UserCog, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { AvailabilityStatus } from '@workspace/db/enums';
import type { UserActivityItem } from '@/types/activity';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'role.assign': { label: '역할 변경', color: 'bg-blue-500/10 text-blue-600' },
  'plan.change': { label: '플랜 변경', color: 'bg-green-500/10 text-green-600' },
  check: { label: '숙소 체크', color: 'bg-purple-500/10 text-purple-600' },
  'accommodation.create': { label: '숙소 등록', color: 'bg-orange-500/10 text-orange-600' },
};

const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; icon: typeof Check; color: string }> = {
  [AvailabilityStatus.AVAILABLE]: { label: '예약 가능', icon: Check, color: 'text-status-success' },
  [AvailabilityStatus.UNAVAILABLE]: { label: '예약 불가', icon: X, color: 'text-muted-foreground' },
  [AvailabilityStatus.ERROR]: { label: '오류', icon: X, color: 'text-destructive' },
  [AvailabilityStatus.UNKNOWN]: { label: '알 수 없음', icon: X, color: 'text-muted-foreground' },
};

function ActionIcon({ action }: { action: string }) {
  if (action === 'role.assign') {
    return <Shield className='size-4' />;
  }
  if (action === 'plan.change') {
    return <UserCog className='size-4' />;
  }
  if (action === 'check') {
    return <Check className='size-4' />;
  }
  if (action === 'accommodation.create') {
    return <Home className='size-4' />;
  }
  return <Check className='size-4' />;
}

function UserAvatar({
  user,
}: {
  user: { name: string | null; email: string | null; image?: string | null } | null | undefined;
}) {
  if (!user) {
    return <div className='size-8 rounded-full bg-muted flex items-center justify-center text-xs'>?</div>;
  }

  if (user.image) {
    return <Image src={user.image} alt='' width={32} height={32} className='size-8 rounded-full' unoptimized />;
  }

  return (
    <div className='size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium'>
      {user.name?.charAt(0) ?? user.email?.charAt(0) ?? '?'}
    </div>
  );
}

interface Props {
  activity: UserActivityItem;
}

export function ActivityItem({ activity }: Props) {
  const actionInfo = ACTION_LABELS[activity.action] ?? {
    label: activity.action,
    color: 'bg-muted text-muted-foreground',
  };

  function renderContent() {
    // Audit log (역할/플랜 변경)
    if (activity.type === 'audit') {
      const oldVal = typeof activity.oldValue === 'string' ? activity.oldValue : JSON.stringify(activity.oldValue);
      const newVal = typeof activity.newValue === 'string' ? activity.newValue : JSON.stringify(activity.newValue);

      return (
        <>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='font-medium text-sm'>{activity.actor?.name ?? activity.actor?.email ?? '시스템'}</span>
            <Badge className={`text-xs ${actionInfo.color}`}>
              <ActionIcon action={activity.action} />
              <span className='ml-1'>{actionInfo.label}</span>
            </Badge>
          </div>
          {(oldVal || newVal) && (
            <div className='flex items-center gap-2 text-sm mt-2'>
              {oldVal && (
                <Badge variant='outline' className='font-normal'>
                  {oldVal}
                </Badge>
              )}
              {oldVal && newVal && <ArrowRight className='size-3 text-muted-foreground' />}
              {newVal && (
                <Badge variant='secondary' className='font-normal'>
                  {newVal}
                </Badge>
              )}
            </div>
          )}
        </>
      );
    }

    // Check log (숙소 체크)
    if (activity.type === 'check') {
      const statusConfig = activity.status ? STATUS_CONFIG[activity.status] : null;
      const StatusIcon = statusConfig?.icon ?? Check;

      return (
        <>
          <div className='flex items-center gap-2 flex-wrap'>
            <Badge className={`text-xs ${actionInfo.color}`}>
              <ActionIcon action={activity.action} />
              <span className='ml-1'>{actionInfo.label}</span>
            </Badge>
            {statusConfig && (
              <span className={`flex items-center gap-1 text-sm ${statusConfig.color}`}>
                <StatusIcon className='size-3' />
                {statusConfig.label}
              </span>
            )}
          </div>
          <div className='text-sm text-muted-foreground mt-1'>
            <span className='font-medium text-foreground'>{activity.accommodation?.name}</span>
            {activity.accommodation?.platform && <span className='ml-1'>({activity.accommodation.platform})</span>}
            {activity.price && <span className='ml-2'>{activity.price}</span>}
          </div>
        </>
      );
    }

    // Accommodation (숙소 등록)
    if (activity.type === 'accommodation') {
      return (
        <>
          <div className='flex items-center gap-2 flex-wrap'>
            <Badge className={`text-xs ${actionInfo.color}`}>
              <ActionIcon action={activity.action} />
              <span className='ml-1'>{actionInfo.label}</span>
            </Badge>
          </div>
          <div className='text-sm text-muted-foreground mt-1'>
            <span className='font-medium text-foreground'>{activity.accommodationName}</span>
            {activity.platform && <span className='ml-1'>({activity.platform})</span>}
          </div>
        </>
      );
    }

    return null;
  }

  return (
    <div className='flex gap-4 py-4'>
      <div className='flex-shrink-0'>
        {activity.type === 'audit' ? (
          <UserAvatar user={activity.actor} />
        ) : (
          <div className='size-8 rounded-full bg-muted flex items-center justify-center'>
            <ActionIcon action={activity.action} />
          </div>
        )}
      </div>
      <div className='flex-1 min-w-0'>
        {renderContent()}
        <div className='text-xs text-muted-foreground mt-2'>
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: ko })}
        </div>
      </div>
    </div>
  );
}
