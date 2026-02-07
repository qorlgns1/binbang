'use client';

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { Features } from './Features';
import { Header } from './Header';
import { Hero } from './Hero';
import { TRANSLATIONS, type Lang } from './landing-data';

export function LandingPage(): React.ReactElement {
  const [lang, setLang] = useState<Lang>('ko');
  const [isDark, setIsDark] = useState(false);
  const copy = TRANSLATIONS[lang];

  const handleToggleTheme = (): void => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const docWithTransition = document as Document & {
      startViewTransition?: (callback: () => void) => void;
    };

    if (!reduceMotion && typeof docWithTransition.startViewTransition === 'function') {
      docWithTransition.startViewTransition(() => {
        flushSync(() => {
          setIsDark((prev) => !prev);
        });
      });
      return;
    }

    setIsDark((prev) => !prev);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === 'ko' ? '빈방어때 | 숙소 빈자리 알림 서비스' : 'Binbang | Vacancy Alert for Your Stay';
  }, [lang]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('binbang-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    setIsDark(shouldUseDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('binbang-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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
        <Hero
          lang={lang}
          copy={copy}
        />
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
