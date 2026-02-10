'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { LandingCopy } from '@/lib/i18n/landing';

const Sheet = dynamic(() => import('@/components/ui/sheet').then((mod) => ({ default: mod.Sheet })), { ssr: false });
const SheetContent = dynamic(() => import('@/components/ui/sheet').then((mod) => ({ default: mod.SheetContent })), {
  ssr: false,
});
const SheetTrigger = dynamic(() => import('@/components/ui/sheet').then((mod) => ({ default: mod.SheetTrigger })), {
  ssr: false,
});

interface MobileMenuProps {
  copy: LandingCopy;
}

/**
 * Render a mobile navigation sheet with links and a login button using localized labels.
 *
 * @param copy - Localized copy for navigation labels; should provide `nav.features`, `nav.status`, `nav.pricing`, and `nav.login`
 * @returns A React element containing a Sheet-based mobile menu with navigation links and a login button
 */
export function MobileMenu({ copy }: MobileMenuProps): React.ReactElement {
  return (
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
          <Link
            href='#features'
            className='text-base text-foreground'
          >
            {copy.nav.features}
          </Link>
          <Link
            href='#status'
            className='text-base text-foreground'
          >
            {copy.nav.status}
          </Link>
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
  );
}
