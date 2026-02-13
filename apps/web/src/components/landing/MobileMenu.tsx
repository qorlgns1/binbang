'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Locale } from '@workspace/shared/i18n';

const Sheet = dynamic(() => import('@/components/ui/sheet').then((mod) => ({ default: mod.Sheet })), { ssr: false });
const SheetContent = dynamic(() => import('@/components/ui/sheet').then((mod) => ({ default: mod.SheetContent })), {
  ssr: false,
});
const SheetTrigger = dynamic(() => import('@/components/ui/sheet').then((mod) => ({ default: mod.SheetTrigger })), {
  ssr: false,
});

interface MobileMenuProps {
  lang: Locale;
}

const navItemClass =
  'flex min-h-11 w-full items-center rounded-lg px-4 py-3 text-base font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * Mobile navigation sheet. 터치 타겟 44px+, 링크 클릭 시 시트 자동 닫힘, 접근성·시각적 계층 반영.
 */
export function MobileMenu({ lang }: MobileMenuProps): React.ReactElement {
  const t = useTranslations('landing');
  const [open, setOpen] = useState(false);

  const closeSheet = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='min-h-9 min-w-9 text-foreground hover:bg-accent'
          aria-label={lang === 'ko' ? '메뉴 열기' : 'Open menu'}
        >
          <Menu className='size-5' aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        side='right'
        className='flex w-[min(100vw-2rem,20rem)] max-w-[20rem] flex-col border-l border-border/60 bg-background px-0 shadow-xl'
      >
        <div className='flex flex-col gap-1 px-4 pt-14 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]'>
          <p className='mb-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground' aria-hidden>
            {lang === 'ko' ? '메뉴' : 'Menu'}
          </p>
          <nav className='flex flex-col gap-0.5' aria-label='Mobile navigation'>
            <Link href={`/${lang}/pricing`} className={navItemClass} onClick={closeSheet}>
              {t('nav.pricing')}
            </Link>
            <Link href={`/${lang}/faq`} className={navItemClass} onClick={closeSheet}>
              {t('nav.faq')}
            </Link>
            <Link href={`/${lang}/about`} className={navItemClass} onClick={closeSheet}>
              {t('nav.about')}
            </Link>
            <Link href={`/${lang}/privacy`} className={navItemClass} onClick={closeSheet}>
              {t('footer.privacy')}
            </Link>
          </nav>
          <hr className='my-4 border-border/60' />
          <Button
            asChild
            className='h-11 w-full rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90'
          >
            <Link href={`/${lang}/login`} onClick={closeSheet}>
              {t('nav.login')}
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
