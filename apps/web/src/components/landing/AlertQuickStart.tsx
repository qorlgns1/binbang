'use client';

import { type FormEvent, useState } from 'react';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Bell, CheckCircle2, Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { type HotelSearchResult, HotelSearchInput } from '@/components/hotel-search/HotelSearchInput';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'search' | 'insight' | 'email' | 'code' | 'done';

interface PropertyInsight {
  observedDays: number;
  sampleSize: number;
  availableCount: number;
  openRate: number | null;
  minPriceAmount: number | null;
  currency: string | null;
  lastObservedAt: string | null;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * 홈 히어로의 알림 등록 플로우.
 *
 * 검색 → 날짜 → 관측 요약 → 이메일 → 코드 → 완료.
 *
 * 알림은 **코드 검증 이후**에 생성한다. 검증이 세션을 만들어 주므로
 * 기존 `POST /api/accommodations`를 그대로 호출할 수 있고,
 * 미검증 계정을 만들지 않아도 된다.
 */
export function AlertQuickStart(): React.ReactElement {
  const t = useTranslations('landing.quickStart');
  const router = useRouter();

  const [step, setStep] = useState<Step>('search');
  const [hotel, setHotel] = useState<HotelSearchResult | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [insight, setInsight] = useState<PropertyInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const today = todayIso();

  async function handleDatesSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError('');

    if (!hotel) {
      setError(t('errorHotel'));
      return;
    }
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setError(t('errorDates'));
      return;
    }

    setStep('insight');
    setInsightLoading(true);
    try {
      const res = await fetch(
        `/api/public/hotel-insight?platform=agoda&platformId=${encodeURIComponent(hotel.hotelId)}`,
      );
      if (res.ok) {
        const data = (await res.json()) as { insight: PropertyInsight | null };
        setInsight(data.insight);
      } else {
        setInsight(null);
      }
    } catch {
      setInsight(null);
    } finally {
      setInsightLoading(false);
    }
  }

  async function sendCode(): Promise<void> {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError(t('errorCreate'));
        return;
      }
      setCode('');
      setStep('code');
    } catch {
      setError(t('errorCreate'));
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!consent) {
      setError(t('errorConsent'));
      return;
    }
    await sendCode();
  }

  async function handleVerify(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!hotel) return;

    setError('');
    setLoading(true);
    try {
      const verifyRes = await fetch('/api/auth/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!verifyRes.ok) {
        const data = (await verifyRes.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? t('errorCreate'));
        return;
      }

      // 검증으로 세션이 생겼으므로 기존 알림 생성 API를 그대로 쓴다.
      const createRes = await fetch('/api/accommodations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId: hotel.hotelId,
          name: hotel.name,
          checkIn,
          checkOut,
          adults: 2,
          children: 0,
          rooms: 1,
          currency: 'KRW',
          locale: 'ko',
          consentOptIn: true,
        }),
      });

      if (!createRes.ok) {
        setError(t('errorCreate'));
        return;
      }

      setStep('done');
    } catch {
      setError(t('errorCreate'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className='border-border/80 bg-card/90 shadow-lg backdrop-blur' data-testid='alert-quick-start'>
      <CardContent className='space-y-4 p-5 sm:p-6'>
        {error && (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'search' && (
          <form onSubmit={handleDatesSubmit} className='space-y-4'>
            <HotelSearchInput
              onSelect={setHotel}
              selectedHotel={hotel}
              onClear={() => setHotel(null)}
              placeholder={t('searchPlaceholder')}
              clearLabel={t('clearHotel')}
              size='lg'
            />

            {hotel && (
              <>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='qs-checkin'>{t('checkIn')}</Label>
                    <Input
                      id='qs-checkin'
                      type='date'
                      min={today}
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                      data-testid='qs-checkin'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <Label htmlFor='qs-checkout'>{t('checkOut')}</Label>
                    <Input
                      id='qs-checkout'
                      type='date'
                      min={checkIn || today}
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                      data-testid='qs-checkout'
                    />
                  </div>
                </div>
                <Button type='submit' className='w-full' data-testid='qs-next'>
                  {t('next')}
                </Button>
              </>
            )}
          </form>
        )}

        {step === 'insight' && (
          <div className='space-y-4'>
            <h3 className='text-sm font-medium text-muted-foreground'>{t('insightTitle')}</h3>

            {insightLoading ? (
              <div className='flex items-center gap-2 py-6 text-muted-foreground'>
                <Loader2 className='size-4 animate-spin' />
              </div>
            ) : insight ? (
              <dl className='grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4'>
                <div className='col-span-2 text-xs text-muted-foreground'>
                  {t('insightObserved', { days: insight.observedDays, samples: insight.sampleSize })}
                </div>
                <div>
                  <dt className='text-xs text-muted-foreground'>{t('insightOpenRate')}</dt>
                  <dd className='text-xl font-semibold'>
                    {insight.openRate == null ? '-' : `${Math.round(insight.openRate * 100)}%`}
                  </dd>
                </div>
                <div>
                  <dt className='text-xs text-muted-foreground'>{t('insightMinPrice')}</dt>
                  <dd className='text-xl font-semibold'>
                    {insight.minPriceAmount == null
                      ? '-'
                      : `${Math.round(insight.minPriceAmount).toLocaleString()} ${insight.currency ?? ''}`.trim()}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className='rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground'>
                {t('insightEmpty')}
              </p>
            )}

            <div className='flex gap-2'>
              <Button variant='outline' onClick={() => setStep('search')} className='flex-1'>
                {t('back')}
              </Button>
              <Button onClick={() => setStep('email')} className='flex-1' data-testid='qs-to-email'>
                {t('next')}
              </Button>
            </div>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='qs-email'>{t('emailTitle')}</Label>
              <Input
                id='qs-email'
                type='email'
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete='email'
                data-testid='qs-email'
              />
            </div>

            <div className='flex items-start gap-3'>
              <Checkbox
                id='qs-consent'
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked === true)}
                className='mt-0.5'
                data-testid='qs-consent'
              />
              <Label htmlFor='qs-consent' className='cursor-pointer text-xs font-normal text-muted-foreground'>
                {t('consent')}
              </Label>
            </div>

            <div className='flex gap-2'>
              <Button type='button' variant='outline' onClick={() => setStep('insight')} className='flex-1'>
                {t('back')}
              </Button>
              <Button type='submit' disabled={loading} className='flex-1' data-testid='qs-send-code'>
                {loading ? t('sending') : t('sendCode')}
              </Button>
            </div>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerify} className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='qs-code'>{t('codeTitle')}</Label>
              <p className='text-xs text-muted-foreground'>{t('codeHint', { email })}</p>
              <Input
                id='qs-code'
                type='text'
                inputMode='numeric'
                autoComplete='one-time-code'
                maxLength={6}
                placeholder='000000'
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                className='text-center text-2xl tracking-[0.4em]'
                data-testid='qs-code'
              />
            </div>

            <Button type='submit' disabled={loading || code.length !== 6} className='w-full' data-testid='qs-verify'>
              {loading ? t('verifying') : t('verify')}
            </Button>

            <div className='flex items-center justify-between'>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='px-0 text-muted-foreground'
                onClick={() => setStep('email')}
              >
                {t('changeEmail')}
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='px-0 text-muted-foreground'
                disabled={loading}
                onClick={() => void sendCode()}
              >
                {t('resend')}
              </Button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className='space-y-4 py-4 text-center' data-testid='qs-done'>
            <CheckCircle2 className='mx-auto size-12 text-primary' />
            <div>
              <p className='text-lg font-semibold'>{t('doneTitle')}</p>
              <p className='mt-1 text-sm text-muted-foreground'>{t('doneBody', { email })}</p>
            </div>
            <Button
              onClick={() => {
                router.push('/dashboard');
                router.refresh();
              }}
              className='w-full'
            >
              <Bell className='mr-2 size-4' />
              {t('goDashboard')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
