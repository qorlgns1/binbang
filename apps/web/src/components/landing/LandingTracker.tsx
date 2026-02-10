'use client';

import { useEffect, useRef, useState } from 'react';

import { setupScrollDepthTracking, trackLandingViewed } from '@/lib/analytics/landing-tracker';
import type { Lang } from '@/lib/i18n/landing';

interface LandingTrackerProps {
  lang: Lang;
}

/**
 * Mounts landing-page analytics and synchronizes the page theme without rendering any UI.
 *
 * Loads the initial theme from localStorage (key `binbang-theme`) or the system preference and applies the `dark` class to `document.documentElement`. Calls analytics to record that the landing was viewed and initializes scroll-depth tracking for the provided language; scroll-depth tracking is cleaned up on unmount or when `lang` changes.
 *
 * @param lang - Locale/language identifier used for analytics and scroll-depth tracking
 * @returns `null` (this component does not render UI)
 */
export function LandingTracker({ lang }: LandingTrackerProps): null {
  const [isDark, setIsDark] = useState(false);
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  // 초기 테마 로드
  useEffect(() => {
    const savedTheme = localStorage.getItem('binbang-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = savedTheme ? savedTheme === 'dark' : prefersDark;

    setIsDark(dark);
    isDarkRef.current = dark;
    document.documentElement.classList.toggle('dark', dark);

    // 테마 결정 후 트래킹 실행
    trackLandingViewed(lang, dark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const cleanup = setupScrollDepthTracking(lang, isDarkRef.current ? 'dark' : 'light');
    return cleanup;
  }, [lang]);

  return null;
}
