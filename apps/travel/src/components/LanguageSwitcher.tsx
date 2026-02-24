'use client';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import type { Locale } from '@/i18n';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentLocale = params.locale as Locale;

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    startTransition(() => {
      const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
      const qs = searchParams.toString();
      router.push(qs ? `${newPath}?${qs}` : newPath);
    });
  };

  return (
    <div className='flex items-center gap-1 rounded-lg border border-border bg-card p-1'>
      <button
        type='button'
        onClick={() => switchLocale('ko')}
        disabled={isPending}
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
