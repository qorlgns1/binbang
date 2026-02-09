'use client';

import { useEffect, useRef, useState } from 'react';

import { setupScrollDepthTracking, trackLandingViewed } from '@/lib/analytics/landing-tracker';
import type { Lang } from '@/lib/i18n/landing';

interface LandingTrackerProps {
  lang: Lang;
}

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
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  // TR-005: Landing viewed tracking (once per session)
  useEffect(() => {
    trackLandingViewed(lang, isDarkRef.current ? 'dark' : 'light');
  }, [lang]);

  // TR-006: Scroll depth tracking
  useEffect(() => {
    const cleanup = setupScrollDepthTracking(lang, isDarkRef.current ? 'dark' : 'light');
    return cleanup;
  }, [lang]);

  return null;
}
