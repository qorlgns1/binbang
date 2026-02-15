'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';
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

const TUTORIAL_STEP_KEYS = ['step1', 'step2', 'step3', 'step4'] as const;
const TOTAL_STEPS = TUTORIAL_STEP_KEYS.length;

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
  const t = useTranslations('common');
  const [step, setStep] = useState(0);
  const completeMutation = useCompleteTutorialMutation();
  const dismissMutation = useDismissTutorialMutation();

  const stepKey = TUTORIAL_STEP_KEYS[step];
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
        aria-label={`${t(`tutorial.${stepKey}.title`)} — ${step + 1}/${TOTAL_STEPS}`}
      >
        <DialogHeader>
          <DialogTitle>{t(`tutorial.${stepKey}.title`)}</DialogTitle>
          <DialogDescription>{t(`tutorial.${stepKey}.body`)}</DialogDescription>
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
            aria-label={t('tutorial.skip')}
          >
            {t('tutorial.skip')}
          </Button>
          <div className='flex gap-2'>
            {!isFirst && (
              <Button variant='outline' size='sm' onClick={handlePrev} disabled={isMutating} aria-label={t('back')}>
                {t('back')}
              </Button>
            )}
            {isLast ? (
              <Button size='sm' onClick={handleComplete} disabled={isMutating} aria-label={t('finish')}>
                {t('finish')}
              </Button>
            ) : (
              <Button size='sm' onClick={handleNext} disabled={isMutating} aria-label={t('next')}>
                {t('next')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
