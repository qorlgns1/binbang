'use client';

import { usePathname, useRouter } from 'next/navigation';

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
  const router = useRouter();
  const pathname = usePathname();

  const handleToggle = (): void => {
    const newLang: Lang = currentLang === 'ko' ? 'en' : 'ko';
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    // 쿠키 저장
    // biome-ignore lint/suspicious/noDocumentCookie: language preference cookie must be set for server-side locale routing
    document.cookie = `binbang-lang=${newLang}; path=/; max-age=31536000`;

    // 트래킹
    trackLocaleToggled(newLang, theme);

    // SPA 방식 네비게이션
    const localeMatch = pathname.match(/^\/(ko|en)(\/.*)?$/);
    if (localeMatch) {
      // Public page: swap locale prefix, preserve rest of path
      router.push(`/${newLang}${localeMatch[2] || ''}`);
    } else {
      // App page: cookie set above, refresh server components
      router.refresh();
    }
  };

  if (variant === 'mobile') {
    return (
      <button
        type='button'
        onClick={handleToggle}
        aria-label={currentLang === 'ko' ? 'Switch to English' : '한국어로 전환'}
        className={`min-h-9 min-w-9 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      >
        {currentLang === 'ko' ? 'EN' : 'KR'}
      </button>
    );
  }

  return (
    <button
      type='button'
      onClick={handleToggle}
      aria-label={currentLang === 'ko' ? 'Switch to English' : '한국어로 전환'}
      className={`flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-2 text-xs font-medium text-foreground outline-none transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <Globe className='size-4 shrink-0 text-muted-foreground' aria-hidden />
      <span>{currentLang === 'ko' ? 'EN' : 'KR'}</span>
    </button>
  );
}
