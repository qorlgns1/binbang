'use client';

import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuotaKey } from '@/generated/prisma/enums';
import { type AdminPlanInfo, useCreatePlan, useUpdatePlan } from '@/hooks/useAdminPlans';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlanInfo | null;
}

function getQuotaValue(
  quotas: { key: QuotaKey; value: number }[] | undefined,
  key: QuotaKey,
  defaultValue: number,
): number {
  return quotas?.find((q) => q.key === key)?.value ?? defaultValue;
}

export function PlanDialog({ open, onOpenChange, plan }: Props) {
  const isEdit = !!plan;
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [maxAccommodations, setMaxAccommodations] = useState(5);
  const [checkIntervalMin, setCheckIntervalMin] = useState(30);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description ?? '');
      setPrice(plan.price);
      setMaxAccommodations(getQuotaValue(plan.quotas, QuotaKey.MAX_ACCOMMODATIONS, 5));
      setCheckIntervalMin(getQuotaValue(plan.quotas, QuotaKey.CHECK_INTERVAL_MIN, 30));
    } else {
      setName('');
      setDescription('');
      setPrice(0);
      setMaxAccommodations(5);
      setCheckIntervalMin(30);
    }
  }, [plan, open]);

  const error = createMutation.error || updateMutation.error;
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name,
      description: description || null,
      price,
      maxAccommodations,
      checkIntervalMin,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: plan.id, ...data },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '플랜 수정' : '플랜 추가'}</DialogTitle>
          <DialogDescription>
            {isEdit ? `"${plan.name}" 플랜을 수정합니다.` : '새로운 요금제 플랜을 추가합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className='space-y-4'
        >
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='name'>플랜 이름 *</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='예: PRO'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>설명</Label>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='플랜에 대한 설명'
              rows={2}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='price'>가격 (원/월)</Label>
            <Input
              id='price'
              type='number'
              min={0}
              value={price}
              onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='maxAccommodations'>최대 숙소 수</Label>
              <Input
                id='maxAccommodations'
                type='number'
                min={1}
                value={maxAccommodations}
                onChange={(e) => setMaxAccommodations(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='checkIntervalMin'>체크 주기 (분)</Label>
              <Input
                id='checkIntervalMin'
                type='number'
                min={1}
                value={checkIntervalMin}
                onChange={(e) => setCheckIntervalMin(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type='submit'
              disabled={isPending}
            >
              {isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
