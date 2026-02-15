'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { trackClosingCTAClicked } from '@/lib/analytics/landingTracker';

/**
 * Renders the landing page footer with closing CTA section and copyright row.
 */
export function Footer(): React.ReactElement {
  const t = useTranslations('landing');
  const lang = useParams().lang as string;

  const handleCTAClick = (): void => {
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    trackClosingCTAClicked(lang, theme);
  };

  return (
    <>
      <section className='border-t border-border bg-secondary px-4 py-20 text-center'>
        <div className='mx-auto max-w-3xl'>
          <h2 className='text-3xl font-semibold text-foreground md:text-4xl'>{t('footer.title')}</h2>
          <p className='mx-auto mt-5 max-w-2xl text-lg text-muted-foreground'>{t('footer.description')}</p>
          <Link
            href={`/${lang}/signup`}
            className='mt-10 inline-block rounded-full border border-primary/40 bg-card px-7 py-3 font-semibold text-primary transition-colors hover:bg-accent'
            onClick={handleCTAClick}
          >
            {t('footer.cta')}
          </Link>
        </div>
      </section>

      <footer className='border-t border-border bg-background px-4 py-7 text-center text-sm text-muted-foreground'>
        <span>{t('footer.copyright')}</span>
        <span className='mx-2'>·</span>
        <Link href={`/${lang}/privacy`} className='underline underline-offset-4 hover:text-foreground'>
          {t('footer.privacy')}
        </Link>
        <span className='mx-2'>·</span>
        <Link href={`/${lang}/terms`} className='underline underline-offset-4 hover:text-foreground'>
          {t('footer.terms')}
        </Link>
      </footer>
    </>
  );
}
