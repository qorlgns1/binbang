'use client';

import { type FormEvent, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '회원가입에 실패했습니다');
        return;
      }

      router.push('/login');
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='flex-1 flex items-center justify-center p-8'>
      <div className='w-full max-w-md'>
        <Card className='shadow-xl'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>회원가입</CardTitle>
            <CardDescription>이메일로 계정을 만드세요</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSignup}
              className='space-y-3'
            >
              <div className='space-y-1.5'>
                <Label htmlFor='name'>이름</Label>
                <Input
                  id='name'
                  type='text'
                  placeholder='홍길동'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete='name'
                />
              </div>
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
                  placeholder='8자 이상'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete='new-password'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='password-confirm'>비밀번호 확인</Label>
                <Input
                  id='password-confirm'
                  type='password'
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete='new-password'
                />
              </div>
              <Button
                type='submit'
                className='w-full'
                disabled={loading}
              >
                {loading ? '가입 중...' : '회원가입'}
              </Button>
            </form>

            <p className='text-center text-sm text-muted-foreground'>
              이미 계정이 있으신가요?{' '}
              <Link
                href='/login'
                className='text-foreground underline underline-offset-4 hover:text-foreground/80'
              >
                로그인
              </Link>
            </p>

            <div className='text-center pt-2'>
              <Link
                href='/pricing'
                className='text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'
              >
                요금제 보기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
