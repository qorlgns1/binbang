'use client';

import { useEffect } from 'react';

import { Landmark, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { PlannerStartForm } from '@/components/chat/PlannerStartForm';
import { trackPlannerEventOnce } from '@/lib/plannerTracking';

interface ChatPanelRestoreBannerProps {
  restoreStatus: 'idle' | 'restoring' | 'failed';
  onRetryRestore: () => void;
  onOpenHistory: () => void;
}

export function ChatPanelRestoreBanner({ restoreStatus, onRetryRestore, onOpenHistory }: ChatPanelRestoreBannerProps) {
  if (restoreStatus === 'restoring') {
    return (
      <div className='border-b border-border/60 bg-primary/5 px-4 py-3 flex items-center gap-2 text-sm text-foreground'>
        <RefreshCw className='h-4 w-4 animate-spin text-primary' aria-hidden />
        <span>이전 대화를 복원하는 중...</span>
      </div>
    );
  }

  if (restoreStatus === 'failed') {
    return (
      <div className='border-b border-border/60 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3'>
        <p className='text-sm text-destructive font-medium'>대화를 자동 복원하지 못했어요.</p>
        <div className='flex items-center gap-2 shrink-0'>
          <button
            type='button'
            onClick={onRetryRestore}
            className='inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/5'
            aria-label='대화 복원 다시 시도'
          >
            다시 시도
          </button>
          <button
            type='button'
            onClick={onOpenHistory}
            className='inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90'
            aria-label='대화 히스토리 열기'
          >
            히스토리 열기
          </button>
        </div>
      </div>
    );
  }

  return null;
}

interface ChatPanelEmptyStateProps {
  onPlannerSubmit: (query: string) => boolean | void;
}

export function ChatPanelPlannerEmptyState({ onPlannerSubmit }: ChatPanelEmptyStateProps) {
  const t = useTranslations('chat');
  const locale = useLocale();

  useEffect(() => {
    trackPlannerEventOnce(`landing_viewed:${locale}`, {
      eventName: 'landing_viewed',
      locale,
    });
  }, [locale]);

  return (
    <div className='flex flex-col items-center justify-center min-h-[55vh] text-center px-4'>
      <div className='flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber-light to-brand-amber/20 dark:from-brand-amber-dark/30 dark:to-brand-amber/10 mb-8 ring-1 ring-brand-amber/20'>
        <Landmark className='h-12 w-12 text-brand-amber dark:text-brand-amber' aria-hidden />
      </div>
      <h2 className='text-2xl font-semibold tracking-tight mb-2 text-foreground'>{t('welcomeTitle')}</h2>
      <p className='text-muted-foreground mb-8 max-w-sm leading-relaxed text-[0.9375rem] sm:text-base'>
        {t('welcomeMessage')}
      </p>
      <div className='w-full max-w-xl rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur-sm sm:p-5'>
        <PlannerStartForm onSubmitPrompt={onPlannerSubmit} />
      </div>
    </div>
  );
}

export function ChatPanelChatEmptyState() {
  const t = useTranslations('chat');

  return (
    <div className='flex min-h-[55vh] flex-col items-center justify-center px-4 text-center'>
      <div className='mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber-light to-brand-amber/20 ring-1 ring-brand-amber/20 dark:from-brand-amber-dark/30 dark:to-brand-amber/10'>
        <Landmark className='h-10 w-10 text-brand-amber' aria-hidden />
      </div>
      <h2 className='mb-2 text-2xl font-semibold tracking-tight text-foreground'>{t('welcomeTitle')}</h2>
      <p className='max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base'>{t('welcomeMessage')}</p>
    </div>
  );
}

export function ChatPanelPlannerLoadingState() {
  const t = useTranslations('chat.planner');

  return (
    <div className='mb-5 rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-sm'>
      <div className='flex items-start gap-3'>
        <div className='mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <RefreshCw className='h-4 w-4 animate-spin' aria-hidden />
        </div>
        <div className='space-y-1.5'>
          <p className='text-sm font-semibold text-foreground sm:text-base'>{t('loadingTitle')}</p>
          <p className='text-sm leading-relaxed text-muted-foreground'>{t('loadingDescription')}</p>
        </div>
      </div>
    </div>
  );
}

interface ChatPanelErrorBannerProps {
  isRateLimitError: boolean;
  message: string | null;
  showLoginAction: boolean;
  onLogin: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ChatPanelErrorBanner({
  isRateLimitError,
  message,
  showLoginAction,
  onLogin,
  onRetry,
  onDismiss,
}: ChatPanelErrorBannerProps) {
  return (
    <div className='border-t border-border/60 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3'>
      <p className='text-sm text-destructive font-medium flex-1'>
        {message ??
          (isRateLimitError
            ? '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
            : '답변을 불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.')}
      </p>
      <div className='flex items-center gap-2 shrink-0'>
        {showLoginAction && (
          <button
            type='button'
            onClick={onLogin}
            className='inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5'
            aria-label='로그인해서 계속 사용하기'
          >
            로그인
          </button>
        )}
        <button
          type='button'
          onClick={onRetry}
          className='inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]'
          aria-label='마지막 메시지 다시 생성'
        >
          <RefreshCw className='h-4 w-4' aria-hidden />
          다시 시도
        </button>
        <button
          type='button'
          onClick={onDismiss}
          className='text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full px-2 py-1 hover:bg-foreground/5'
          aria-label='에러 메시지 닫기'
        >
          닫기
        </button>
      </div>
    </div>
  );
}
