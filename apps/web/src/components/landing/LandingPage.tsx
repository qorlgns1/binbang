'use client';

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { Features } from './Features';
import { Header } from './Header';
import { Hero } from './Hero';
import { type Lang, TRANSLATIONS } from './landing-data';

export function LandingPage(): React.ReactElement {
  const [lang, setLang] = useState<Lang>('ko');
  const [isDark, setIsDark] = useState(false);
  const copy = TRANSLATIONS[lang];

  const handleToggleTheme = (): void => {
    const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsViewTransition = 'startViewTransition' in document;

    if (!hasReducedMotion && supportsViewTransition) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        flushSync(() => setIsDark((prev) => !prev));
      });
      return;
    }

    setIsDark((prev) => !prev);
  };

  // 초기 테마 로드
  useEffect(() => {
    const savedTheme = localStorage.getItem('binbang-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme ? savedTheme === 'dark' : prefersDark);
  }, []);

  // 언어 및 테마 적용
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === 'ko' ? '빈방어때 | 숙소 빈자리 알림 서비스' : 'Binbang | Vacancy Alert for Your Stay';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('binbang-theme', isDark ? 'dark' : 'light');
  }, [lang, isDark]);

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <Header
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'ko' ? 'en' : 'ko'))}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        copy={copy}
      />

      <main>
        <Hero copy={copy} />
        <Features copy={copy} />

        <section className='border-t border-border bg-secondary px-4 py-20 text-center'>
          <div className='mx-auto max-w-3xl'>
            <h2 className='text-3xl font-semibold text-foreground md:text-4xl'>{copy.footer.title}</h2>
            <p className='mx-auto mt-5 max-w-2xl text-lg text-muted-foreground'>{copy.footer.description}</p>
            <a
              href='/signup'
              className='mt-10 inline-block rounded-full border border-primary/40 bg-card px-7 py-3 font-semibold text-primary transition-colors hover:bg-accent'
            >
              {copy.footer.cta}
            </a>
          </div>
        </section>

        <footer className='border-t border-border bg-background px-4 py-7 text-center text-sm text-muted-foreground'>
          {copy.footer.copyright}
        </footer>
      </main>
    </div>
  );
}
