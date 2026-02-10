import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { LandingCopy, Lang } from '@/lib/i18n/landing';

import { LangToggle } from './LangToggle';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  lang: Lang;
  copy: LandingCopy;
}

/**
 * Render the landing-page header with brand, navigation links, language and theme controls, and mobile menu.
 *
 * @param lang - Current language identifier used by the language and theme controls
 * @param copy - Localized copy for header labels (brand, features, status, pricing, login)
 * @returns The header element for the site's landing page containing desktop and mobile navigation
 */
export function Header({ lang, copy }: HeaderProps): React.ReactElement {
  return (
    <header className='fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur'>
      <div className='mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4'>
        <Link
          href='/'
          className='flex items-center gap-2'
        >
          <span className='flex size-8 items-center justify-center rounded-full bg-primary'>
            <span className='size-2 rounded-full bg-primary-foreground animate-ping' />
          </span>
          <span className='text-sm font-semibold tracking-wide text-foreground md:text-base'>{copy.nav.brand}</span>
        </Link>

        <nav className='hidden items-center gap-6 md:flex'>
          <a
            href='#features'
            className='landing-header-link text-sm text-muted-foreground hover:text-primary'
          >
            {copy.nav.features}
          </a>
          <a
            href='#status'
            className='landing-header-link text-sm text-muted-foreground hover:text-primary'
          >
            {copy.nav.status}
          </a>
          <Link
            href='/pricing'
            className='landing-header-link text-sm text-muted-foreground hover:text-primary'
          >
            {copy.nav.pricing}
          </Link>

          <LangToggle currentLang={lang} />
          <ThemeToggle lang={lang} />

          <Button
            asChild
            variant='outline'
            className='border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:text-primary'
          >
            <Link href='/login'>{copy.nav.login}</Link>
          </Button>
        </nav>

        <div className='flex items-center gap-2 md:hidden'>
          <ThemeToggle
            lang={lang}
            variant='mobile'
          />
          <LangToggle
            currentLang={lang}
            variant='mobile'
          />
          <MobileMenu copy={copy} />
        </div>
      </div>
    </header>
  );
}