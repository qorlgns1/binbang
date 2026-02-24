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
import { QuotaKey } from '@workspace/db/enums';
import { type AdminPlanInfo, useCreatePlan, useUpdatePlan } from '@/hooks/useAdminPlans';
import { getUserMessage, getValidationFieldErrors } from '@/lib/apiError';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: AdminPlanInfo | null;
}

type PlanField = 'name' | 'description' | 'price' | 'maxAccommodations' | 'checkIntervalMin' | '_form';

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PlanField, string>>>({});

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
    setFieldErrors({});
  }, [plan]);

  const error = createMutation.error || updateMutation.error;
  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!error) {
      return;
    }

    const errors = getValidationFieldErrors(error);
    if (!errors) {
      return;
    }

    setFieldErrors({
      _form: errors._form,
      name: errors.name,
      description: errors.description,
      price: errors.price,
      maxAccommodations: errors.maxAccommodations,
      checkIntervalMin: errors.checkIntervalMin,
    });
  }, [error]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? '플랜 수정' : '플랜 추가'}</DialogTitle>
          <DialogDescription>
            {isEdit ? `"${plan.name}" 플랜을 수정합니다.` : '새로운 요금제 플랜을 추가합니다.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{getUserMessage(error)}</AlertDescription>
            </Alert>
          )}
          {fieldErrors._form && <p className='text-sm text-destructive'>{fieldErrors._form}</p>}

          <div className='space-y-2'>
            <Label htmlFor='name'>플랜 이름 *</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder='예: PRO'
              required
            />
            {fieldErrors.name && <p className='text-xs text-destructive'>{fieldErrors.name}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>설명</Label>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder='플랜에 대한 설명'
              rows={2}
            />
            {fieldErrors.description && <p className='text-xs text-destructive'>{fieldErrors.description}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='price'>가격 (원/월)</Label>
            <Input
              id='price'
              type='number'
              min={0}
              value={price}
              onChange={(e) => {
                setPrice(parseInt(e.target.value, 10) || 0);
                setFieldErrors((prev) => ({ ...prev, price: undefined }));
              }}
            />
            {fieldErrors.price && <p className='text-xs text-destructive'>{fieldErrors.price}</p>}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='maxAccommodations'>최대 숙소 수</Label>
              <Input
                id='maxAccommodations'
                type='number'
                min={1}
                value={maxAccommodations}
                onChange={(e) => {
                  setMaxAccommodations(parseInt(e.target.value, 10) || 1);
                  setFieldErrors((prev) => ({ ...prev, maxAccommodations: undefined }));
                }}
              />
              {fieldErrors.maxAccommodations && (
                <p className='text-xs text-destructive'>{fieldErrors.maxAccommodations}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='checkIntervalMin'>체크 주기 (분)</Label>
              <Input
                id='checkIntervalMin'
                type='number'
                min={1}
                value={checkIntervalMin}
                onChange={(e) => {
                  setCheckIntervalMin(parseInt(e.target.value, 10) || 1);
                  setFieldErrors((prev) => ({ ...prev, checkIntervalMin: undefined }));
                }}
              />
              {fieldErrors.checkIntervalMin && (
                <p className='text-xs text-destructive'>{fieldErrors.checkIntervalMin}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
