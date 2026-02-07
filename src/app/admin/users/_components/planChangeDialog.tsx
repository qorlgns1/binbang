'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminPlans } from '@/hooks/useAdminPlans';
import { useUpdateUserPlan } from '@/hooks/useUpdateUserPlan';
import type { AdminUserInfo } from '@/types/admin';

interface PlanChangeDialogProps {
  user: AdminUserInfo | null;
  onClose: () => void;
}

export function PlanChangeDialog({ user, onClose }: PlanChangeDialogProps) {
  const mutation = useUpdateUserPlan();
  const { data: plans, isLoading: plansLoading } = useAdminPlans();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  if (user && !initialized) {
    setSelectedPlan(user.planName ?? '');
    setInitialized(true);
  }

  function handleClose() {
    mutation.reset();
    setInitialized(false);
    setSelectedPlan('');
    onClose();
  }

  function handleConfirm() {
    if (!user || !selectedPlan) return;
    mutation.mutate(
      { id: user.id, planName: selectedPlan },
      {
        onSuccess: () => handleClose(),
      },
    );
  }

  const hasChanged = user ? user.planName !== selectedPlan : false;

  function formatPrice(price: number): string {
    if (price === 0) return '무료';
    return `${price.toLocaleString()}원/월`;
  }

  return (
    <Dialog
      open={!!user}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>플랜 변경</DialogTitle>
          <DialogDescription>
            <span className='font-medium text-foreground'>{user?.name ?? user?.email ?? '사용자'}</span>의 플랜을
            변경합니다.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className='space-y-4 py-2'>
            <div>
              <div className='text-sm text-muted-foreground mb-1'>현재 플랜</div>
              <Badge variant='outline'>{user.planName ?? '없음'}</Badge>
            </div>

            <div>
              <div className='text-sm text-muted-foreground mb-2'>변경할 플랜</div>
              {plansLoading ? (
                <div className='space-y-2'>
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className='h-16 w-full'
                    />
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={selectedPlan}
                  onValueChange={setSelectedPlan}
                  className='space-y-2'
                >
                  {plans?.map((plan) => (
                    <div
                      key={plan.id}
                      className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedPlan === plan.name ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedPlan(plan.name)}
                    >
                      <RadioGroupItem
                        value={plan.name}
                        id={plan.id}
                      />
                      <Label
                        htmlFor={plan.id}
                        className='flex-1 cursor-pointer'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <div className='font-medium'>{plan.name}</div>
                            <div className='text-xs text-muted-foreground'>{plan.description}</div>
                          </div>
                          <div className='text-sm font-medium'>{formatPrice(plan.price)}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          </div>
        )}

        {mutation.isError && (
          <p className='text-sm text-destructive'>{mutation.error?.message ?? '플랜 변경에 실패했습니다'}</p>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mutation.isPending || !selectedPlan || !hasChanged}
          >
            {mutation.isPending ? '변경 중...' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
