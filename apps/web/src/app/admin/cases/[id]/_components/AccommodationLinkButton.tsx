'use client';

import { useState } from 'react';

import { CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLinkAccommodationMutation } from '@/features/admin/cases';

interface Props {
  caseId: string;
  currentStatus: string;
  accommodationId: string | null;
}

export function AccommodationLinkButton({ caseId, currentStatus, accommodationId }: Props) {
  const [open, setOpen] = useState(false);
  const [inputId, setInputId] = useState('');
  const linkMutation = useLinkAccommodationMutation();

  if (currentStatus !== 'WAITING_PAYMENT') {
    if (!accommodationId) return null;
    return (
      <div className='flex items-center gap-2 text-sm'>
        <span className='text-muted-foreground'>숙소</span>
        <span className='font-mono text-xs'>{accommodationId}</span>
      </div>
    );
  }

  if (accommodationId) {
    return (
      <div className='flex items-center gap-2 text-sm'>
        <CheckCircle className='size-4 text-green-500' />
        <span className='text-muted-foreground'>숙소 연결됨:</span>
        <span className='font-mono text-xs'>{accommodationId}</span>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!inputId.trim()) return;

    linkMutation.mutate(
      { caseId, accommodationId: inputId.trim() },
      {
        onSuccess: () => {
          setOpen(false);
          setInputId('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          숙소 연결
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>숙소 연결</DialogTitle>
          <DialogDescription>모니터링할 숙소의 ID를 입력하세요</DialogDescription>
        </DialogHeader>

        <div className='space-y-2 py-4'>
          <Label htmlFor='accommodation-id'>숙소 ID</Label>
          <Input
            id='accommodation-id'
            placeholder='숙소 ID를 입력하세요'
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
          />
        </div>

        {linkMutation.isError && <p className='text-sm text-destructive'>{linkMutation.error.message}</p>}

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!inputId.trim() || linkMutation.isPending}>
            {linkMutation.isPending ? '처리 중...' : '연결'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
