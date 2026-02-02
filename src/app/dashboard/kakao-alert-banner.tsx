'use client';

import { useState } from 'react';

import { signIn, signOut } from 'next-auth/react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function KakaoAlertBanner() {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isExpanded) {
    return (
      <Button
        variant='link'
        onClick={() => setIsExpanded(true)}
        className='mb-4 px-0 text-sm text-yellow-700'
      >
        ⚠️ 카카오톡 알림 설정 안내 보기
      </Button>
    );
  }

  const handleKakaoLogin = async () => {
    // 현재 세션을 로그아웃하고 카카오로 다시 로그인
    await signOut({ redirect: false });
    await signIn('kakao', { callbackUrl: '/dashboard' });
  };

  return (
    <Alert className='mb-6 border-yellow-200 bg-yellow-50 text-yellow-900'>
      <div className='flex items-start justify-between gap-4'>
        <div className='flex gap-3'>
          <span className='text-2xl'>⚠️</span>
          <div>
            <AlertTitle className='text-yellow-900'>카카오톡 알림을 받을 수 없습니다</AlertTitle>
            <AlertDescription className='text-yellow-800'>
              현재 Google 계정으로 로그인되어 있습니다. 숙소 예약 가능 알림을 카카오톡으로 받으려면 카카오 계정으로
              로그인해주세요.
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
          className='text-yellow-700 hover:text-yellow-900'
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
