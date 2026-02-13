'use client';

import { type FormEvent, Suspense, useState } from 'react';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { LangToggle } from '@/components/landing/LangToggle';
import { AuthBrandPanel } from '@/app/(public)/_components/authBrandPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function LoginForm(): React.ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('auth');
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
        setError(data.error || t('errors.loginFailed'));
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='relative flex flex-1 items-center justify-center p-4 md:p-8'>
      <div className='absolute right-4 top-4'>
        <LangToggle currentLang={lang as 'ko' | 'en'} />
      </div>
      <div className='mx-auto grid w-full max-w-6xl items-stretch gap-6 md:grid-cols-[1.05fr_0.95fr]'>
        <AuthBrandPanel ctaLabel={t('login.ctaLanding')} ctaHref={`/${lang}`} />

        <Card className='h-full border-border/80 bg-card/90 shadow-lg backdrop-blur'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>{t('login.title')}</CardTitle>
            <CardDescription>{t('login.description')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCredentialsLogin} className='space-y-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='email'>{t('login.email')}</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='name@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete='email'
                  className='bg-background/80'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='password'>{t('login.password')}</Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete='current-password'
                  className='bg-background/80'
                />
              </div>
              <Button
                type='submit'
                className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
                disabled={loading}
              >
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>

            <p className='text-center text-sm text-muted-foreground'>
              {t('login.noAccount')}{' '}
              <Link
                href={`/${lang}/signup`}
                className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
              >
                {t('login.signup')}
              </Link>
            </p>

            <div className='relative flex items-center gap-3'>
              <Separator className='flex-1' />
              <span className='text-xs text-muted-foreground'>{t('login.or')}</span>
              <Separator className='flex-1' />
            </div>

            <Button
              onClick={() => signIn('kakao', { callbackUrl })}
              className='w-full justify-center gap-3 bg-[#FEE500] text-[#191919] hover:bg-[#FDD800]'
            >
              <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
                <title>Kakao</title>
                <path d='M12 3C6.477 3 2 6.463 2 10.742c0 2.782 1.86 5.22 4.656 6.585-.145.525-.936 3.385-1.008 3.623 0 0-.02.168.089.233.109.065.236.031.236.031.313-.043 3.624-2.363 4.193-2.766.588.082 1.2.125 1.834.125 5.523 0 10-3.463 10-7.742S17.523 3 12 3z' />
              </svg>
              {t('login.kakaoLogin')}
            </Button>

            <Button
              variant='outline'
              onClick={() => signIn('google', { callbackUrl })}
              className='w-full justify-center gap-3 border-border bg-background/70'
            >
              <svg width='24' height='24' viewBox='0 0 24 24'>
                <title>Google</title>
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
              {t('login.googleLogin')}
            </Button>

            <p className='pt-1 text-center text-xs text-muted-foreground'>{t('login.kakaoNote')}</p>

            <div className='text-center pt-1'>
              <Link
                href={`/${lang}/pricing`}
                className='text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'
              >
                {t('login.pricingLink')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function LoginFormFallback(): React.ReactElement {
  return (
    <main className='flex flex-1 items-center justify-center p-4 md:p-8'>
      <div className='mx-auto grid w-full max-w-6xl items-stretch gap-6 md:grid-cols-[1.05fr_0.95fr]'>
        <div className='h-[420px] rounded-2xl border border-border bg-card/60 animate-pulse' />
        <Card className='h-full shadow-xl'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-2 h-8 w-24 rounded bg-muted animate-pulse' />
            <div className='mx-auto mb-2 h-4 w-52 rounded bg-muted animate-pulse' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='h-12 w-full rounded-lg bg-muted animate-pulse' />
            <div className='h-12 w-full rounded-lg bg-muted animate-pulse' />
            <div className='h-12 w-full rounded-lg bg-muted animate-pulse' />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage(): React.ReactElement {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
