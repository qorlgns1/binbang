'use client';

import { Suspense } from 'react';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// useSearchParams를 사용하는 컴포넌트는 반드시 Suspense 안에 있어야 함
function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  return (
    <div className='w-full max-w-md'>
      <Card className='shadow-xl'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>로그인</CardTitle>
          <CardDescription>소셜 계정으로 간편하게 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 카카오 로그인 */}
          <Button
            onClick={() => signIn('kakao', { callbackUrl })}
            className='w-full justify-center gap-3 bg-[#FEE500] text-[#191919] hover:bg-[#FDD800]'
          >
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path d='M12 3C6.477 3 2 6.463 2 10.742c0 2.782 1.86 5.22 4.656 6.585-.145.525-.936 3.385-1.008 3.623 0 0-.02.168.089.233.109.065.236.031.236.031.313-.043 3.624-2.363 4.193-2.766.588.082 1.2.125 1.834.125 5.523 0 10-3.463 10-7.742S17.523 3 12 3z' />
            </svg>
            카카오로 로그인
          </Button>

          {/* 구글 로그인 */}
          <Button
            variant='outline'
            onClick={() => signIn('google', { callbackUrl })}
            className='w-full justify-center gap-3'
          >
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
            >
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            구글로 로그인
          </Button>

          <p className='text-xs text-muted-foreground text-center pt-2'>
            카카오 로그인 시 카카오톡 알림 기능을 사용할 수 있습니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// 로딩 폴백
function LoginFormFallback() {
  return (
    <div className='w-full max-w-md'>
      <Card className='shadow-xl'>
        <CardHeader className='text-center'>
          <div className='h-8 w-24 bg-muted rounded mx-auto mb-2 animate-pulse' />
          <div className='h-4 w-48 bg-muted rounded mx-auto mb-2 animate-pulse' />
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='w-full h-12 bg-muted rounded-lg animate-pulse' />
          <div className='w-full h-12 bg-muted rounded-lg animate-pulse' />
        </CardContent>
      </Card>
    </div>
  );
}

// 메인 페이지 - Suspense로 LoginForm을 감싸서 export
export default function LoginPage() {
  return (
    <main className='min-h-screen flex items-center justify-center p-8 bg-muted/40'>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
