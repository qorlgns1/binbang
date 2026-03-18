'use client';

import { signIn } from 'next-auth/react';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
  trigger: 'save' | 'history' | 'bookmark' | 'limit';
}

export const TRIGGER_MESSAGES = {
  save: {
    title: '로그인하고 대화를 저장하세요',
    description: '대화 내역을 저장하고 언제든 다시 보려면 로그인이 필요해요.',
  },
  history: {
    title: '이전 대화를 보려면 로그인하세요',
    description: '저장된 대화 내역을 보려면 로그인이 필요해요.',
  },
  bookmark: {
    title: '북마크를 저장하려면 로그인하세요',
    description: '북마크 기능을 사용하려면 로그인이 필요해요.',
  },
  limit: {
    title: '계속 사용하려면 로그인하세요',
    description: '게스트 한도에 도달했어요. 로그인하면 더 많은 대화를 이어갈 수 있어요.',
  },
};

export function LoginPromptModal({ open, onClose, trigger }: LoginPromptModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button[aria-label="모달 닫기"], button[aria-label="닫기"]',
    );
    firstFocusable?.focus();
  }, [open]);

  if (!open) return null;

  const message = TRIGGER_MESSAGES[trigger];

  const handleGoogleLogin = () => {
    void signIn('google');
  };

  const handleKakaoLogin = () => {
    void signIn('kakao');
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center' role='presentation'>
      {/* Overlay */}
      <button
        type='button'
        onClick={onClose}
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        aria-label='모달 닫기'
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='login-prompt-title'
        className='relative z-10 w-full max-w-md mx-4 bg-background rounded-2xl p-6 shadow-2xl border border-border'
        onKeyDown={handleKeyDown}
      >
        {/* Close button */}
        <button
          type='button'
          onClick={onClose}
          className='absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors'
          aria-label='닫기'
        >
          <X className='h-4 w-4' />
        </button>

        {/* Header */}
        <div className='mb-6'>
          <h2 id='login-prompt-title' className='text-2xl font-bold mb-2'>
            {message.title}
          </h2>
          <p className='text-muted-foreground text-sm'>{message.description}</p>
        </div>

        {/* Login buttons */}
        <div className='space-y-3'>
          <button
            type='button'
            onClick={handleGoogleLogin}
            className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium'
          >
            <svg className='w-5 h-5' viewBox='0 0 24 24' role='img' aria-label='Google 로고'>
              <title>Google</title>
              <path
                fill='currentColor'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='currentColor'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='currentColor'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='currentColor'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Google로 계속하기
          </button>

          <button
            type='button'
            onClick={handleKakaoLogin}
            className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FEE500] text-[#000000] rounded-lg hover:bg-[#FDD835] transition-colors font-medium'
          >
            <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor' role='img' aria-label='Kakao 로고'>
              <title>Kakao</title>
              <path d='M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z' />
            </svg>
            Kakao로 계속하기
          </button>
        </div>

        {/* Footer */}
        <div className='mt-6 text-center'>
          <button
            type='button'
            onClick={onClose}
            className='text-sm text-muted-foreground hover:text-foreground transition-colors'
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
