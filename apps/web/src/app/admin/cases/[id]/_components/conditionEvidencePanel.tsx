'use client';

import { useState } from 'react';

import Image from 'next/image';
import { Camera, CheckCircle, Copy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { ConditionMetEvent } from '@/features/admin/cases/queries';

import { formatDateTime } from './formatDateTime';

interface Props {
  conditionMetEvents: ConditionMetEvent[];
  currentStatus: string;
}

export function ConditionEvidencePanel({ conditionMetEvents, currentStatus }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ACTIVE_MONITORING 이후 상태에서만 표시
  const visibleStatuses = ['ACTIVE_MONITORING', 'CONDITION_MET', 'BILLED', 'CLOSED'];
  if (!visibleStatuses.includes(currentStatus)) return null;

  if (conditionMetEvents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>증거 패킷</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>아직 수집된 증거가 없습니다</p>
        </CardContent>
      </Card>
    );
  }

  const handleCopy = async (event: ConditionMetEvent) => {
    const data = {
      id: event.id,
      checkLogId: event.checkLogId,
      evidenceSnapshot: event.evidenceSnapshot,
      capturedAt: event.capturedAt,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CheckCircle className='size-4 text-green-500' />
          증거 패킷 ({conditionMetEvents.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {conditionMetEvents.map((evt) => {
          const snapshot = evt.evidenceSnapshot as Record<string, unknown> | null;
          return (
            <div key={evt.id} className='border rounded-lg p-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <Badge variant='outline'>{String(snapshot?.platform ?? '-')}</Badge>
                <span className='text-xs text-muted-foreground'>{formatDateTime(evt.capturedAt)}</span>
              </div>

              <div className='grid grid-cols-2 gap-2 text-sm'>
                <div>
                  <span className='text-muted-foreground'>상태: </span>
                  <span className='font-medium'>{String(snapshot?.status ?? '-')}</span>
                </div>
                <div>
                  <span className='text-muted-foreground'>가격: </span>
                  <span className='font-medium'>{String(snapshot?.price ?? '-')}</span>
                </div>
              </div>

              {typeof snapshot?.checkUrl === 'string' && (
                <div className='text-xs text-muted-foreground break-all'>{snapshot.checkUrl}</div>
              )}

              <div className='flex items-center gap-2'>
                {evt.screenshotBase64 && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant='outline' size='sm'>
                        <Camera className='size-3 mr-1' />
                        스크린샷
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-3xl'>
                      <DialogHeader>
                        <DialogTitle>증거 스크린샷 - {formatDateTime(evt.capturedAt)}</DialogTitle>
                      </DialogHeader>
                      <Image
                        src={`data:image/png;base64,${evt.screenshotBase64}`}
                        alt='Evidence screenshot'
                        className='w-full rounded border'
                        width={1200}
                        height={800}
                        unoptimized
                      />
                    </DialogContent>
                  </Dialog>
                )}
                <Button variant='ghost' size='sm' onClick={() => handleCopy(evt)}>
                  <Copy className='size-3 mr-1' />
                  {copiedId === evt.id ? '복사됨' : '복사'}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
