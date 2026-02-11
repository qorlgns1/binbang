'use client';

import Link from 'next/link';

import { trackClosingCTAClicked } from '@/lib/analytics/landing-tracker';
import type { LandingCopy, Lang } from '@/lib/i18n/landing';

interface FooterProps {
  copy: LandingCopy;
  lang: Lang;
}

/**
 * Renders the landing page footer containing a closing CTA section and a copyright row.
 *
 * The CTA link reports a closing-CTA analytics event when clicked.
 *
 * @param copy - Localized landing copy containing `footer` text (`title`, `description`, `cta`, `copyright`)
 * @param lang - Active language code used for analytics reporting
 * @returns The footer React element
 */
export function Footer({ copy, lang }: FooterProps): React.ReactElement {
  const handleCTAClick = (): void => {
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    trackClosingCTAClicked(lang, theme);
  };

  return (
    <>
      <section className='border-t border-border bg-secondary px-4 py-20 text-center'>
        <div className='mx-auto max-w-3xl'>
          <h2 className='text-3xl font-semibold text-foreground md:text-4xl'>{copy.footer.title}</h2>
          <p className='mx-auto mt-5 max-w-2xl text-lg text-muted-foreground'>{copy.footer.description}</p>
          <Link
            href='/signup'
            className='mt-10 inline-block rounded-full border border-primary/40 bg-card px-7 py-3 font-semibold text-primary transition-colors hover:bg-accent'
            onClick={handleCTAClick}
          >
            {copy.footer.cta}
          </Link>
        </div>
      </section>

      <footer className='border-t border-border bg-background px-4 py-7 text-center text-sm text-muted-foreground'>
        <span>{copy.footer.copyright}</span>
        <span className='mx-2'>·</span>
        <Link
          href='/privacy'
          className='underline underline-offset-4 hover:text-foreground'
        >
          {copy.footer.privacy}
        </Link>
      </footer>
    </>
  );
}
