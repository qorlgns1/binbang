'use client';

import { useParams } from 'next/navigation';
import { useTransition } from 'react';

import { usePathname, useRouter } from '@/navigation';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@workspace/shared/i18n';

const locales = SUPPORTED_LOCALES;
const defaultLocale = DEFAULT_LOCALE;

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const localeParam = params.locale;
  const normalizedLocale =
    typeof localeParam === 'string' && locales.includes(localeParam as Locale) ? localeParam : defaultLocale;
  const currentLocale = normalizedLocale as Locale;

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className='flex items-center gap-1 rounded-lg border border-border bg-card p-1'>
      <button
        type='button'
        onClick={() => switchLocale('ko')}
        disabled={isPending}
        aria-pressed={currentLocale === 'ko'}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          currentLocale === 'ko'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label='한국어로 전환'
      >
        한국어
      </button>
      <button
        type='button'
        onClick={() => switchLocale('en')}
        disabled={isPending}
        aria-pressed={currentLocale === 'en'}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          currentLocale === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label='Switch to English'
      >
        English
      </button>
    </div>
  );
}
