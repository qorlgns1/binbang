'use client';

import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useHeartbeatHistory } from '@/hooks/useHeartbeatHistory';

const SLOT_COUNT = 120; // 2시간 = 120분
const SLOT_MINUTES = 1;

export function HeartbeatTimeline() {
  const { data: history, isLoading } = useHeartbeatHistory();

  const timelineData = useMemo((): Array<{
    minute: number;
    startTime: Date;
    status: string;
    isProcessing: boolean;
    uptime?: number | null;
  }> => {
    if (!history || history.length === 0) return [];

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - SLOT_COUNT * SLOT_MINUTES * 60 * 1000);

    return Array.from(
      { length: SLOT_COUNT },
      (_, i): { minute: number; startTime: Date; status: string; isProcessing: boolean; uptime?: number | null } => {
        const slotStart = new Date(twoHoursAgo.getTime() + i * SLOT_MINUTES * 60 * 1000);
        const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000);

        const slotHistory = history.filter((item): boolean => {
          const itemTime = new Date(item.timestamp);
          return itemTime >= slotStart && itemTime < slotEnd;
        });

        const latestStatus = slotHistory[slotHistory.length - 1];

        return {
          minute: i,
          startTime: slotStart,
          status: latestStatus?.status || 'unknown',
          isProcessing: latestStatus?.isProcessing || false,
          uptime: latestStatus?.uptime,
        };
      },
    );
  }, [history]);

  const getStatusColor = (status: string, isProcessing: boolean): string => {
    if (isProcessing) return 'bg-status-warning';
    if (status === 'healthy') return 'bg-status-success';
    if (status === 'unhealthy') return 'bg-status-error';
    return 'bg-muted';
  };

  const getStatusLabel = (status: string, isProcessing: boolean): string => {
    if (isProcessing) return '처리 중';
    if (status === 'healthy') return '정상';
    if (status === 'unhealthy') return '비정상';
    return '알 수 없음';
  };

  if (isLoading) {
    return (
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>최근 2시간 상태 타임라인 (1분 단위)</span>
          <Badge variant='outline'>로딩 중</Badge>
        </div>
        <Skeleton className='h-6 w-full' />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>최근 2시간 상태 타임라인 (1분 단위)</span>
          <Badge variant='outline'>데이터 없음</Badge>
        </div>
        <div className='flex gap-0.5 h-6'>
          {Array.from({ length: SLOT_COUNT }).map(
            (_, i): React.ReactElement => (
              <div
                key={i}
                className='flex-1 h-full bg-muted rounded-sm'
              />
            ),
          )}
        </div>
      </div>
    );
  }

  const lastSlotIndex = SLOT_COUNT - 1;

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>최근 2시간 상태 타임라인 (1분 단위)</span>
        <Badge variant='outline'>실시간</Badge>
      </div>

      <div className='flex gap-0.5 h-6'>
        {timelineData.map(
          (slot): React.ReactElement => (
            <div
              key={slot.minute}
              className={`flex-1 h-full rounded-sm ${getStatusColor(slot.status, slot.isProcessing)} ${slot.minute === lastSlotIndex ? 'ring-2 ring-ring ring-offset-1' : ''} hover:opacity-80 cursor-pointer`}
              title={`${slot.startTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - ${getStatusLabel(slot.status, slot.isProcessing)}${slot.uptime ? ` (실행시간: ${Math.floor(slot.uptime / 60)}분)` : ''}`}
            />
          ),
        )}
      </div>

      <div className='flex items-center justify-center gap-4 text-xs'>
        <div className='flex items-center gap-1'>
          <div className='w-3 h-3 bg-status-success rounded-full' />
          <span>정상</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-3 h-3 bg-status-warning rounded-full' />
          <span>처리 중</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-3 h-3 bg-status-error rounded-full' />
          <span>비정상</span>
        </div>
        <div className='flex items-center gap-1'>
          <div className='w-3 h-3 ring-2 ring-ring ring-offset-2 rounded-full' />
          <span>현재 시간</span>
        </div>
      </div>
    </div>
  );
}
