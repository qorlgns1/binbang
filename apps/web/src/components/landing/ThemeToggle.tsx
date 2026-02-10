'use client';

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { Moon, Sun } from 'lucide-react';

import { trackThemeToggled } from '@/lib/analytics/landing-tracker';
import type { Lang } from '@/lib/i18n/landing';

interface ThemeToggleProps {
  lang: Lang;
  className?: string;
  variant?: 'desktop' | 'mobile';
}

/**
 * Renders a theme toggle control that switches the site between light and dark modes.
 *
 * The control updates document.documentElement's `dark` class, persists the choice to localStorage
 * under `binbang-theme`, and reports the change via analytics. When available and allowed by the
 * user's motion preferences, it uses the View Transition API for a smooth update.
 *
 * @param lang - Locale used to choose the aria-label (e.g., 'ko' selects the Korean label)
 * @param className - Optional additional CSS classes applied to the button
 * @param variant - Layout variant to render; `'desktop'` shows a labeled rounded button, `'mobile'` shows a compact icon button
 * @returns A React element that toggles the site's theme between light and dark
 */
export function ThemeToggle({ lang, className = '', variant = 'desktop' }: ThemeToggleProps): React.ReactElement {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const handleToggle = (): void => {
    const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsViewTransition = 'startViewTransition' in document;
    const newIsDark = !isDark;

    if (!hasReducedMotion && supportsViewTransition) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        flushSync(() => {
          document.documentElement.classList.toggle('dark', newIsDark);
          setIsDark(newIsDark);
        });
      });
    } else {
      document.documentElement.classList.toggle('dark', newIsDark);
      setIsDark(newIsDark);
    }

    localStorage.setItem('binbang-theme', newIsDark ? 'dark' : 'light');
    trackThemeToggled(lang, newIsDark ? 'dark' : 'light');
  };

  if (variant === 'mobile') {
    return (
      <button
        type='button'
        onClick={handleToggle}
        aria-label={lang === 'ko' ? '다크 모드 전환' : 'Toggle dark mode'}
        className={`rounded-md px-2 py-1 text-xs font-medium text-foreground ${className}`}
      >
        {isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
      </button>
    );
  }

  return (
    <button
      type='button'
      onClick={handleToggle}
      aria-label={lang === 'ko' ? '다크 모드 전환' : 'Toggle dark mode'}
      className={`flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/50 hover:text-primary ${className}`}
    >
      {isDark ? <Sun className='size-3.5' /> : <Moon className='size-3.5' />}
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
