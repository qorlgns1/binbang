'use client';

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { Moon, Sun } from 'lucide-react';

import { trackThemeToggled } from '@/lib/analytics/landingTracker';
import type { Locale } from '@workspace/shared/i18n';

interface ThemeToggleProps {
  lang: Locale;
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

  const baseFocusClass =
    'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  if (variant === 'mobile') {
    return (
      <button
        type='button'
        onClick={handleToggle}
        aria-label={lang === 'ko' ? '다크 모드 전환' : 'Toggle dark mode'}
        className={`h-9 min-w-9 rounded-md px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground ${baseFocusClass} ${className}`}
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
      className={`flex h-9 items-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary ${baseFocusClass} ${className}`}
    >
      {isDark ? <Sun className='size-3.5 shrink-0' /> : <Moon className='size-3.5 shrink-0' />}
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
