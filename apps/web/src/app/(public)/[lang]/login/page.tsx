'use client';

import { type FormEvent, Suspense, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AuthBrandPanel } from '@/app/(public)/_components/AuthBrandPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildPublicPath } from '@/lib/i18n-runtime/publicPath';

type Step = 'email' | 'code';

function LoginForm(): React.ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('auth');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode(isResend: boolean): Promise<void> {
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale: lang }),
      });

      if (res.status === 429) {
        setError(t('errors.rateLimited'));
        return;
      }

      if (!res.ok) {
        setError(t('errors.codeSendFailed'));
        return;
      }

      setStep('code');
      setCode('');
      if (isResend) setNotice(t('login.resent'));
    } catch {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode(e: FormEvent): Promise<void> {
    e.preventDefault();
    await sendCode(false);
  }

  async function handleVerify(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (res.ok) {
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      if (res.status === 429) {
        setError(t('errors.tooManyAttempts'));
        setStep('email');
        return;
      }

      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? t('errors.codeInvalid'));
    } catch {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='relative flex flex-1 items-center justify-center p-4 md:p-8'>
      <div className='mx-auto grid w-full max-w-6xl items-stretch gap-6 md:grid-cols-[1.05fr_0.95fr]'>
        <AuthBrandPanel ctaLabel={t('login.ctaLanding')} ctaHref={buildPublicPath(lang, '')} />

        <Card className='h-full border-border/80 bg-card/90 shadow-lg backdrop-blur'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>{step === 'email' ? t('login.title') : t('login.codeTitle')}</CardTitle>
            <CardDescription>
              {step === 'email' ? t('login.description') : t('login.codeSentTo', { email })}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {notice && (
              <Alert>
                <AlertDescription>{notice}</AlertDescription>
              </Alert>
            )}

            {step === 'email' ? (
              <form onSubmit={handleSendCode} className='space-y-3' data-testid='login-form'>
                <div className='space-y-1.5'>
                  <Label htmlFor='email'>{t('login.emailLabel')}</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='name@example.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete='email'
                    className='bg-background/80'
                    data-testid='login-email-input'
                  />
                </div>
                <Button
                  type='submit'
                  className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
                  disabled={loading}
                  data-testid='login-send-code-button'
                >
                  {loading ? t('login.sending') : t('login.sendCode')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className='space-y-3' data-testid='login-code-form'>
                <div className='space-y-1.5'>
                  <Label htmlFor='code'>{t('login.codeLabel')}</Label>
                  <Input
                    id='code'
                    type='text'
                    inputMode='numeric'
                    autoComplete='one-time-code'
                    pattern='\d{6}'
                    maxLength={6}
                    placeholder='000000'
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    required
                    // biome-ignore lint/a11y/noAutofocus: 코드 입력은 이 화면의 유일한 목적이다
                    autoFocus
                    className='bg-background/80 text-center text-2xl tracking-[0.4em]'
                    data-testid='login-code-input'
                  />
                  <p className='text-xs text-muted-foreground'>{t('login.spamHint')}</p>
                </div>
                <Button
                  type='submit'
                  className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
                  disabled={loading || code.length !== 6}
                  data-testid='login-verify-button'
                >
                  {loading ? t('login.verifying') : t('login.verify')}
                </Button>

                <div className='flex items-center justify-between pt-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='px-0 text-muted-foreground'
                    onClick={() => {
                      setStep('email');
                      setCode('');
                      setError('');
                      setNotice('');
                    }}
                  >
                    {t('login.changeEmail')}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='px-0 text-muted-foreground'
                    disabled={loading}
                    onClick={() => void sendCode(true)}
                    data-testid='login-resend-button'
                  >
                    {t('login.resend')}
                  </Button>
                </div>
              </form>
            )}

            <div className='text-center pt-1'>
              <Link
                href={buildPublicPath(lang, '/pricing')}
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
