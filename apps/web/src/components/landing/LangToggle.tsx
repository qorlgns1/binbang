'use client';

import { Globe } from 'lucide-react';

import { trackLocaleToggled } from '@/lib/analytics/landing-tracker';
import type { Lang } from '@/lib/i18n/landing';

interface LangToggleProps {
  currentLang: Lang;
  className?: string;
  variant?: 'desktop' | 'mobile';
}

/**
 * Render a language toggle button that switches the site language between Korean and English.
 *
 * Activating the button sets a one-year cookie (`binbang-lang`), records the toggle via analytics,
 * and navigates the browser to the selected language root (`/ko` or `/en`).
 *
 * @param currentLang - Current language code, either `'ko'` or `'en'`
 * @param className - Additional CSS classes applied to the button
 * @param variant - Rendering variant; `'desktop'` shows an icon and pill styling, `'mobile'` shows a compact label. Defaults to `'desktop'`
 * @returns A button element that toggles the site language when clicked
 */
export function LangToggle({ currentLang, className = '', variant = 'desktop' }: LangToggleProps): React.ReactElement {
  const handleToggle = (): void => {
    const newLang: Lang = currentLang === 'ko' ? 'en' : 'ko';
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    // 쿠키 저장
    document.cookie = `binbang-lang=${newLang}; path=/; max-age=31536000`;

    // 트래킹
    trackLocaleToggled(newLang, theme);

    // URL 이동
    window.location.href = `/${newLang}`;
  };

  if (variant === 'mobile') {
    return (
      <button
        type='button'
        onClick={handleToggle}
        className={`rounded-md px-2 py-1 text-xs font-medium text-foreground ${className}`}
      >
        {currentLang === 'ko' ? 'EN' : 'KR'}
      </button>
    );
  }

  return (
    <button
      type='button'
      onClick={handleToggle}
      className={`flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/50 hover:text-primary ${className}`}
    >
      <Globe className='size-3.5' />
      {currentLang === 'ko' ? 'EN' : 'KR'}
    </button>
  );
}