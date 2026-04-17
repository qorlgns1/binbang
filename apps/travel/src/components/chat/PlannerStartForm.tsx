'use client';

import { type FormEvent, useRef, useState } from 'react';

import { useLocale, useTranslations } from 'next-intl';

import { trackPlannerEvent, trackPlannerEventOnce } from '@/lib/plannerTracking';

interface PlannerStartFormProps {
  onSubmitPrompt: (prompt: string) => boolean | undefined;
}

type PlannerField = 'destination' | 'checkIn' | 'checkOut' | 'adults';

type PlannerFieldErrors = Partial<Record<PlannerField, string>>;

function isEnglishLocale(locale: string): boolean {
  return locale.toLowerCase().startsWith('en');
}

export function PlannerStartForm({ onSubmitPrompt }: PlannerStartFormProps): React.ReactElement {
  const t = useTranslations('chat.planner');
  const locale = useLocale();
  const hasTrackedStartRef = useRef(false);

  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('2');
  const [budget, setBudget] = useState('');
  const [style, setStyle] = useState('');
  const [fieldErrors, setFieldErrors] = useState<PlannerFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearFieldError(field: PlannerField): void {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function markStarted(): void {
    if (hasTrackedStartRef.current) {
      return;
    }

    hasTrackedStartRef.current = true;
    trackPlannerEventOnce(`planner_started:${locale}`, {
      eventName: 'planner_started',
      locale,
    });
  }

  function validate(): PlannerFieldErrors {
    const nextErrors: PlannerFieldErrors = {};
    const trimmedDestination = destination.trim();
    const trimmedAdults = adults.trim();
    const parsedAdults = Number.parseInt(trimmedAdults, 10);

    if (!trimmedDestination) {
      nextErrors.destination = t('errors.destinationRequired');
    }

    if (!checkIn) {
      nextErrors.checkIn = t('errors.checkInRequired');
    }

    if (!checkOut) {
      nextErrors.checkOut = t('errors.checkOutRequired');
    } else if (checkIn && checkOut <= checkIn) {
      nextErrors.checkOut = t('errors.checkOutAfterCheckIn');
    }

    if (!trimmedAdults) {
      nextErrors.adults = t('errors.adultsRequired');
    } else if (!Number.isInteger(parsedAdults) || parsedAdults < 1) {
      nextErrors.adults = t('errors.adultsInvalid');
    }

    return nextErrors;
  }

  function buildPrompt(): string {
    const trimmedBudget = budget.trim();
    const trimmedStyle = style.trim();

    if (isEnglishLocale(locale)) {
      return [
        'I need hotel recommendations for a trip.',
        `The destination is ${destination.trim()}, check-in is ${checkIn}, check-out is ${checkOut}, and there will be ${Number.parseInt(adults, 10)} adult(s).`,
        `Budget is ${trimmedBudget || 'no preference'}, and preferred accommodation style is ${trimmedStyle || 'no preference'}.`,
        'Please use searchAccommodation when appropriate and prioritize bookable hotel stays.',
        'If any properties include Agoda information, include them near the top.',
      ].join('\n');
    }

    return [
      '여행 숙소 추천이 필요해.',
      `목적지는 ${destination.trim()}이고 체크인은 ${checkIn}, 체크아웃은 ${checkOut}, 성인은 ${Number.parseInt(adults, 10)}명이야.`,
      `예산은 ${trimmedBudget || '상관없음'}, 원하는 숙소 스타일은 ${trimmedStyle || '상관없음'}이야.`,
      '호텔 숙소 추천이 필요하니 가능하면 searchAccommodation을 사용해서 예약 가능한 숙소를 우선 보여줘.',
      'Agoda 정보가 있는 숙소가 있으면 우선 포함해줘.',
    ].join('\n');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const didSubmit = onSubmitPrompt(buildPrompt());
      if (didSubmit === false) {
        setIsSubmitting(false);
        return;
      }

      trackPlannerEvent({
        eventName: 'planner_submitted',
        locale,
      });
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className='w-full space-y-4 text-left' data-testid='planner-start-form'>
      <div>
        <h3 className='text-base font-semibold text-foreground sm:text-lg'>{t('title')}</h3>
        <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>{t('description')}</p>
      </div>

      <div className='space-y-2'>
        <label htmlFor='planner-destination' className='text-sm font-medium text-foreground'>
          {t('destinationLabel')}
        </label>
        <input
          id='planner-destination'
          type='text'
          value={destination}
          onChange={(event) => {
            markStarted();
            setDestination(event.target.value);
            clearFieldError('destination');
          }}
          onFocus={markStarted}
          placeholder={t('destinationPlaceholder')}
          className='w-full rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
          aria-invalid={fieldErrors.destination ? 'true' : 'false'}
          disabled={isSubmitting}
        />
        {fieldErrors.destination && <p className='text-xs text-destructive'>{fieldErrors.destination}</p>}
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <label htmlFor='planner-checkin' className='text-sm font-medium text-foreground'>
            {t('checkInLabel')}
          </label>
          <input
            id='planner-checkin'
            type='date'
            value={checkIn}
            onChange={(event) => {
              markStarted();
              setCheckIn(event.target.value);
              clearFieldError('checkIn');
              if (fieldErrors.checkOut) {
                clearFieldError('checkOut');
              }
            }}
            onFocus={markStarted}
            className='w-full rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
            aria-invalid={fieldErrors.checkIn ? 'true' : 'false'}
            disabled={isSubmitting}
          />
          {fieldErrors.checkIn && <p className='text-xs text-destructive'>{fieldErrors.checkIn}</p>}
        </div>

        <div className='space-y-2'>
          <label htmlFor='planner-checkout' className='text-sm font-medium text-foreground'>
            {t('checkOutLabel')}
          </label>
          <input
            id='planner-checkout'
            type='date'
            value={checkOut}
            onChange={(event) => {
              markStarted();
              setCheckOut(event.target.value);
              clearFieldError('checkOut');
            }}
            onFocus={markStarted}
            className='w-full rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
            aria-invalid={fieldErrors.checkOut ? 'true' : 'false'}
            disabled={isSubmitting}
          />
          {fieldErrors.checkOut && <p className='text-xs text-destructive'>{fieldErrors.checkOut}</p>}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='space-y-2 sm:col-span-1'>
          <label htmlFor='planner-adults' className='text-sm font-medium text-foreground'>
            {t('adultsLabel')}
          </label>
          <input
            id='planner-adults'
            type='number'
            min='1'
            step='1'
            inputMode='numeric'
            value={adults}
            onChange={(event) => {
              markStarted();
              setAdults(event.target.value);
              clearFieldError('adults');
            }}
            onFocus={markStarted}
            className='w-full rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
            aria-invalid={fieldErrors.adults ? 'true' : 'false'}
            disabled={isSubmitting}
          />
          {fieldErrors.adults && <p className='text-xs text-destructive'>{fieldErrors.adults}</p>}
        </div>

        <div className='space-y-2 sm:col-span-2'>
          <label htmlFor='planner-budget' className='text-sm font-medium text-foreground'>
            {t('budgetLabel')}
          </label>
          <input
            id='planner-budget'
            type='text'
            value={budget}
            onChange={(event) => {
              markStarted();
              setBudget(event.target.value);
            }}
            onFocus={markStarted}
            placeholder={t('budgetPlaceholder')}
            className='w-full rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className='space-y-2'>
        <label htmlFor='planner-style' className='text-sm font-medium text-foreground'>
          {t('styleLabel')}
        </label>
        <input
          id='planner-style'
          type='text'
          value={style}
          onChange={(event) => {
            markStarted();
            setStyle(event.target.value);
          }}
          onFocus={markStarted}
          placeholder={t('stylePlaceholder')}
          className='w-full rounded-xl border border-border/80 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/15'
          disabled={isSubmitting}
        />
      </div>

      <button
        type='submit'
        disabled={isSubmitting}
        className='inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'
        data-testid='planner-submit-button'
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
