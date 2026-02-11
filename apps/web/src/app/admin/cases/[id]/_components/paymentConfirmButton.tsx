'use client';

import { useState } from 'react';

import { CheckCircle2, CreditCard } from 'lucide-react';

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useConfirmPaymentMutation } from '@/features/admin/cases';

interface Props {
  caseId: string;
  currentStatus: string;
  paymentConfirmedAt: string | null;
  paymentConfirmedBy: string | null;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PaymentConfirmButton({ caseId, currentStatus, paymentConfirmedAt, paymentConfirmedBy }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const mutation = useConfirmPaymentMutation();

  if (currentStatus !== 'WAITING_PAYMENT') {
    return null;
  }

  if (paymentConfirmedAt) {
    return (
      <div className='flex items-center gap-2 text-sm text-green-600'>
        <CheckCircle2 className='size-4' />
        <span>결제 확인됨 ({formatDateTime(paymentConfirmedAt)})</span>
        {paymentConfirmedBy && <span className='text-muted-foreground'>by {paymentConfirmedBy}</span>}
      </div>
    );
  }

  const handleSubmit = () => {
    mutation.mutate(
      {
        caseId,
        ...(note.trim() ? { note: note.trim() } : {}),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setNote('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          <CreditCard className='size-4 mr-2' />
          결제 확인
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>결제 확인</DialogTitle>
          <DialogDescription>결제가 확인되었음을 기록합니다. 확인 후에는 취소할 수 없습니다.</DialogDescription>
        </DialogHeader>

        <div className='space-y-2 py-4'>
          <Label htmlFor='payment-note'>메모 (선택)</Label>
          <Textarea
            id='payment-note'
            placeholder='결제 관련 메모를 입력하세요...'
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>

        {mutation.isError && <p className='text-sm text-destructive'>{mutation.error.message}</p>}

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? '처리 중...' : '결제 확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
