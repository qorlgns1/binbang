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
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useCompleteTutorialMutation, useDismissTutorialMutation } from '@/features/user/mutations';

// ============================================================================
// Constants
// ============================================================================

const TUTORIAL_STEPS = [
  {
    title: '빈방 시작하기',
    body: '원하는 숙소를 등록하면 빈방 발생 시 카카오톡으로 알림을 받아요.',
  },
  {
    title: '첫 번째 숙소를 등록하세요',
    body: '에어비앤비, 아고다 등 원하는 숙소 URL을 등록하면 자동으로 빈방을 체크해요.',
  },
  {
    title: '카카오톡 알림 설정',
    body: '카카오 계정을 연동하면 빈방 발생 시 카카오톡으로 즉시 알림을 받을 수 있어요.',
  },
  {
    title: '준비 완료!',
    body: '이제 빈방이 24시간 예약 가능 여부를 모니터링해드릴게요. 편하게 기다리세요!',
  },
] as const;

const TOTAL_STEPS = TUTORIAL_STEPS.length;

// ============================================================================
// Props
// ============================================================================

interface FirstUserTutorialDialogProps {
  open: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function FirstUserTutorialDialog({ open }: FirstUserTutorialDialogProps): React.ReactElement {
  const [step, setStep] = useState(0);
  const completeMutation = useCompleteTutorialMutation();
  const dismissMutation = useDismissTutorialMutation();

  const currentStep = TUTORIAL_STEPS[step];
  const isFirst = step === 0;
  const isLast = step === TOTAL_STEPS - 1;
  const isMutating = completeMutation.isPending || dismissMutation.isPending;

  const handlePrev = (): void => {
    if (!isFirst) setStep((s) => s - 1);
  };

  const handleNext = (): void => {
    if (!isLast) setStep((s) => s + 1);
  };

  const handleComplete = (): void => {
    completeMutation.mutate();
  };

  const handleDismiss = (): void => {
    dismissMutation.mutate();
  };

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        aria-label={`튜토리얼 ${step + 1}단계: ${currentStep.title}`}
      >
        <DialogHeader>
          <DialogTitle>{currentStep.title}</DialogTitle>
          <DialogDescription>{currentStep.body}</DialogDescription>
        </DialogHeader>

        <div className='space-y-1.5'>
          <Progress value={((step + 1) / TOTAL_STEPS) * 100} />
          <p className='text-center text-xs text-muted-foreground'>
            {step + 1} / {TOTAL_STEPS}
          </p>
        </div>

        <DialogFooter className='flex-row items-center gap-2 sm:justify-between'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleDismiss}
            disabled={isMutating}
            aria-label='튜토리얼 건너뛰기'
          >
            건너뛰기
          </Button>
          <div className='flex gap-2'>
            {!isFirst && (
              <Button variant='outline' size='sm' onClick={handlePrev} disabled={isMutating} aria-label='이전 단계'>
                이전
              </Button>
            )}
            {isLast ? (
              <Button size='sm' onClick={handleComplete} disabled={isMutating} aria-label='튜토리얼 완료'>
                완료
              </Button>
            ) : (
              <Button size='sm' onClick={handleNext} disabled={isMutating} aria-label='다음 단계'>
                다음
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
