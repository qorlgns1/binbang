'use client';

import { type FormEvent, Suspense, useState } from 'react';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCredentialsLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/credentials-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '로그인에 실패했습니다');
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='w-full max-w-md'>
      <Card className='shadow-xl'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>로그인</CardTitle>
          <CardDescription>이메일 또는 소셜 계정으로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleCredentialsLogin}
            className='space-y-3'
          >
            <div className='space-y-1.5'>
              <Label htmlFor='email'>이메일</Label>
              <Input
                id='email'
                type='email'
                placeholder='name@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='password'>비밀번호</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete='current-password'
              />
            </div>
            <Button
              type='submit'
              className='w-full'
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <p className='text-center text-sm text-muted-foreground'>
            계정이 없으신가요?{' '}
            <Link
              href='/signup'
              className='text-foreground underline underline-offset-4 hover:text-foreground/80'
            >
              회원가입
            </Link>
          </p>

          <div className='relative flex items-center gap-3'>
            <Separator className='flex-1' />
            <span className='text-xs text-muted-foreground'>또는</span>
            <Separator className='flex-1' />
          </div>

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
          <div className='w-full h-12 bg-muted rounded-lg animate-pulse' />
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className='min-h-screen flex items-center justify-center p-8 bg-muted/40'>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
