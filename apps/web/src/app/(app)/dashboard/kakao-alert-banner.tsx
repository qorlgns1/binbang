'use client';

import { useState } from 'react';

import { signIn, signOut } from 'next-auth/react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function KakaoAlertBanner(): React.ReactElement | null {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <Button
        variant='link'
        onClick={() => setIsExpanded(true)}
        className='mb-6 h-auto px-0 text-sm text-muted-foreground hover:text-foreground'
      >
        카카오톡 알림 설정 안내 보기
      </Button>
    );
  }

  const handleKakaoLogin = async (): Promise<void> => {
    await signOut({ redirect: false });
    await signIn('kakao', { callbackUrl: '/dashboard' });
  };

  return (
    <Alert className='mb-6 border-primary/30 bg-card/90 backdrop-blur'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex gap-3'>
          <div className='flex size-10 items-center justify-center rounded-full bg-primary/10'>
            <span className='text-xl'>💡</span>
          </div>
          <div>
            <AlertTitle className='text-foreground'>카카오톡으로 빈방 소식 받기</AlertTitle>
            <AlertDescription className='text-muted-foreground'>
              카카오 계정으로 로그인하면 숙소 예약 가능 시 즉시 카카오톡 알림을 받을 수 있습니다.
            </AlertDescription>
            <Button
              onClick={handleKakaoLogin}
              className='mt-3 inline-flex items-center gap-2 bg-[#FEE500] text-[#191919] hover:bg-[#FDD800]'
            >
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M12 3C6.477 3 2 6.463 2 10.742c0 2.782 1.86 5.22 4.656 6.585-.145.525-.936 3.385-1.008 3.623 0 0-.02.168.089.233.109.065.236.031.236.031.313-.043 3.624-2.363 4.193-2.766.588.082 1.2.125 1.834.125 5.523 0 10-3.463 10-7.742S17.523 3 12 3z' />
              </svg>
              카카오로 다시 로그인
            </Button>
          </div>
        </div>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={() => setIsExpanded(false)}
          aria-label='닫기'
          className='text-caution-foreground/80 hover:text-caution-foreground'
        >
          <svg
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path d='M18 6L6 18M6 6l12 12' />
          </svg>
        </Button>
      </div>
    </Alert>
  );
}
