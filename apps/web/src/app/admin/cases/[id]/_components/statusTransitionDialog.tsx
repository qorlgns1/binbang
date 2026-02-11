'use client';

import { useState } from 'react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTransitionCaseStatusMutation } from '@/features/admin/cases';

interface Props {
  caseId: string;
  currentStatus: string;
  paymentConfirmedAt: string | null;
}

const TRANSITIONS: Record<string, { value: string; label: string }[]> = {
  RECEIVED: [{ value: 'REVIEWING', label: '검토 시작' }],
  REVIEWING: [
    { value: 'NEEDS_CLARIFICATION', label: '명확화 요청' },
    { value: 'WAITING_PAYMENT', label: '결제 대기' },
    { value: 'REJECTED', label: '거부' },
  ],
  NEEDS_CLARIFICATION: [{ value: 'REVIEWING', label: '검토 재개' }],
  WAITING_PAYMENT: [
    { value: 'ACTIVE_MONITORING', label: '모니터링 시작' },
    { value: 'CANCELLED', label: '취소' },
  ],
  ACTIVE_MONITORING: [
    { value: 'CONDITION_MET', label: '조건 충족' },
    { value: 'EXPIRED', label: '만료' },
    { value: 'CANCELLED', label: '취소' },
  ],
  CONDITION_MET: [{ value: 'BILLED', label: '청구' }],
  BILLED: [{ value: 'CLOSED', label: '완료 처리' }],
};

export function StatusTransitionDialog({ caseId, currentStatus, paymentConfirmedAt }: Props) {
  const [open, setOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [reason, setReason] = useState('');
  const transitionMutation = useTransitionCaseStatusMutation();

  const availableTransitions = TRANSITIONS[currentStatus] ?? [];

  if (availableTransitions.length === 0) {
    return null;
  }

  const handleSubmit = () => {
    if (!targetStatus) return;

    transitionMutation.mutate(
      {
        caseId,
        status: targetStatus,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setTargetStatus('');
          setReason('');
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm'>상태 변경</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>케이스 상태 변경</DialogTitle>
          <DialogDescription>현재 상태: {currentStatus}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='target-status'>변경할 상태</Label>
            <Select value={targetStatus} onValueChange={setTargetStatus}>
              <SelectTrigger id='target-status'>
                <SelectValue placeholder='상태 선택' />
              </SelectTrigger>
              <SelectContent>
                {availableTransitions.map((t) => {
                  const disabled = t.value === 'ACTIVE_MONITORING' && !paymentConfirmedAt;
                  return (
                    <SelectItem key={t.value} value={t.value} disabled={disabled}>
                      {t.label}
                      {disabled ? ' (결제 확인 필요)' : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='transition-reason'>사유 (선택)</Label>
            <Textarea
              id='transition-reason'
              placeholder='상태 변경 사유를 입력하세요...'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {transitionMutation.isError && <p className='text-sm text-destructive'>{transitionMutation.error.message}</p>}

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!targetStatus || transitionMutation.isPending}>
            {transitionMutation.isPending ? '처리 중...' : '변경'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
