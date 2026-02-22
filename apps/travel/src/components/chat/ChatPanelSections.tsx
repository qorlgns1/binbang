import { Landmark, RefreshCw } from 'lucide-react';

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
  queries: string[];
  onExampleClick: (query: string) => void;
}

export function ChatPanelEmptyState({ queries, onExampleClick }: ChatPanelEmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center min-h-[55vh] text-center px-4'>
      <div className='flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-amber-light to-brand-amber/20 dark:from-brand-amber-dark/30 dark:to-brand-amber/10 mb-8 ring-1 ring-brand-amber/20'>
        <Landmark className='h-12 w-12 text-brand-amber dark:text-brand-amber' aria-hidden />
      </div>
      <h2 className='text-2xl font-semibold tracking-tight mb-2 text-foreground'>빈방</h2>
      <p className='text-muted-foreground mb-8 max-w-sm leading-relaxed text-[0.9375rem] sm:text-base'>
        반가워요. 당신의 휴식이 길을 잃지 않도록, 빈방이 밤새 불을 밝혀둘게요.
      </p>
      <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3'>추천 질문</p>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl'>
        {queries.map((query) => (
          <button
            key={query}
            type='button'
            onClick={() => onExampleClick(query)}
            className='rounded-full border border-border/60 bg-background/60 px-5 py-3 text-left text-sm text-foreground transition-all duration-200 hover:bg-muted/60 hover:border-border hover:shadow-sm active:scale-[0.99]'
            aria-label={`추천 질문: ${query}`}
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ChatPanelErrorBannerProps {
  isRateLimitError: boolean;
  showLoginAction: boolean;
  onLogin: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ChatPanelErrorBanner({
  isRateLimitError,
  showLoginAction,
  onLogin,
  onRetry,
  onDismiss,
}: ChatPanelErrorBannerProps) {
  return (
    <div className='border-t border-border/60 bg-destructive/5 px-4 py-3 flex items-center justify-between gap-3'>
      <p className='text-sm text-destructive font-medium flex-1'>
        {isRateLimitError
          ? '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
          : '답변을 불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.'}
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
