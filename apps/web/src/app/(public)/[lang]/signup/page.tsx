'use client';

import { type FormEvent, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AuthBrandPanel } from '@/app/(public)/_components/AuthBrandPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage(): React.ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const router = useRouter();
  const t = useTranslations('auth');

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
      setError(t('errors.passwordMismatch'));
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
        setError(data.error || t('errors.signupFailed'));
        return;
      }

      router.push(`/${lang}/login`);
    } catch {
      setError(t('errors.serverError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='relative flex flex-1 items-center justify-center p-4 md:p-8'>
      <div className='mx-auto grid w-full max-w-6xl items-stretch gap-6 md:grid-cols-[1.05fr_0.95fr]'>
        <AuthBrandPanel ctaLabel={t('signup.ctaLogin')} ctaHref={`/${lang}/login`} />

        <Card className='h-full border-border/80 bg-card/90 shadow-lg backdrop-blur'>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>{t('signup.title')}</CardTitle>
            <CardDescription>{t('signup.description')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignup} className='space-y-3'>
              <div className='space-y-1.5'>
                <Label htmlFor='name'>{t('signup.name')}</Label>
                <Input
                  id='name'
                  type='text'
                  placeholder={t('signup.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete='name'
                  className='bg-background/80'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='email'>{t('signup.email')}</Label>
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
                <Label htmlFor='password'>{t('signup.password')}</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder={t('signup.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete='new-password'
                  className='bg-background/80'
                />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='password-confirm'>{t('signup.confirmPassword')}</Label>
                <Input
                  id='password-confirm'
                  type='password'
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete='new-password'
                  className='bg-background/80'
                />
              </div>
              <Button
                type='submit'
                className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
                disabled={loading}
              >
                {loading ? t('signup.submitting') : t('signup.submit')}
              </Button>
            </form>

            <p className='text-center text-sm text-muted-foreground'>
              {t('signup.hasAccount')}{' '}
              <Link
                href={`/${lang}/login`}
                className='font-medium text-primary underline underline-offset-4 hover:text-primary/80'
              >
                {t('signup.login')}
              </Link>
            </p>

            <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1 text-center'>
              <Link
                href={`/${lang}/pricing`}
                className='text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'
              >
                {t('signup.pricingLink')}
              </Link>
              <span className='text-muted-foreground'>·</span>
              <Link
                href={`/${lang}/privacy`}
                className='text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'
              >
                {t('signup.privacyLink')}
              </Link>
              <span className='text-muted-foreground'>·</span>
              <Link
                href={`/${lang}/terms`}
                className='text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground'
              >
                {t('signup.termsLink')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
