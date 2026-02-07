import Link from 'next/link';

import { Globe, Menu, Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import type { LandingCopy, Lang } from './landing-data';

interface HeaderProps {
  lang: Lang;
  onToggleLang: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  copy: LandingCopy;
}

export function Header({ lang, onToggleLang, isDark, onToggleTheme, copy }: HeaderProps): React.ReactElement {
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
            className='text-sm text-muted-foreground transition-colors hover:text-primary'
          >
            {copy.nav.features}
          </a>
          <a
            href='#status'
            className='text-sm text-muted-foreground transition-colors hover:text-primary'
          >
            {copy.nav.status}
          </a>
          <Link
            href='/pricing'
            className='text-sm text-muted-foreground transition-colors hover:text-primary'
          >
            {copy.nav.pricing}
          </Link>

          <button
            type='button'
            onClick={onToggleLang}
            className='flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/50 hover:text-primary'
          >
            <Globe className='size-3.5' />
            {lang === 'ko' ? 'EN' : 'KR'}
          </button>

          <button
            type='button'
            onClick={onToggleTheme}
            aria-label={lang === 'ko' ? '다크 모드 전환' : 'Toggle dark mode'}
            className='flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-foreground transition-colors hover:border-primary/50 hover:text-primary'
          >
            {isDark ? <Sun className='size-3.5' /> : <Moon className='size-3.5' />}
            {isDark ? 'Light' : 'Dark'}
          </button>

          <Button
            asChild
            variant='outline'
            className='border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:text-primary'
          >
            <Link href='/login'>{copy.nav.login}</Link>
          </Button>
        </nav>

        <div className='flex items-center gap-2 md:hidden'>
          <button
            type='button'
            onClick={onToggleTheme}
            aria-label={lang === 'ko' ? '다크 모드 전환' : 'Toggle dark mode'}
            className='rounded-md px-2 py-1 text-xs font-medium text-foreground'
          >
            {isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
          </button>
          <button
            type='button'
            onClick={onToggleLang}
            className='rounded-md px-2 py-1 text-xs font-medium text-foreground'
          >
            {lang === 'ko' ? 'EN' : 'KR'}
          </button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='text-foreground hover:bg-accent'
              >
                <Menu className='size-5' />
              </Button>
            </SheetTrigger>
            <SheetContent className='border-border bg-background text-foreground'>
              <div className='mt-10 flex flex-col gap-4'>
                <a
                  href='#features'
                  className='text-base text-foreground'
                >
                  {copy.nav.features}
                </a>
                <a
                  href='#status'
                  className='text-base text-foreground'
                >
                  {copy.nav.status}
                </a>
                <Link
                  href='/pricing'
                  className='text-base text-foreground'
                >
                  {copy.nav.pricing}
                </Link>
                <Button
                  asChild
                  className='mt-2 bg-primary text-primary-foreground hover:bg-primary/90'
                >
                  <Link href='/login'>{copy.nav.login}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
