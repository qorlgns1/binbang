'use client';

import { Compass, LogIn, LogOut } from 'lucide-react';
import { signIn, signOut } from 'next-auth/react';

import { OnlineStatus } from '@/components/OnlineStatus';
import type { AuthStatus } from '@/lib/authStatus';

interface HomeTopBarProps {
  authStatus: AuthStatus;
  entityCount: number;
}

export function HomeTopBar({ authStatus, entityCount }: HomeTopBarProps) {
  return (
    <header className='flex h-12 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-md'>
      <div className='flex items-center gap-2 md:hidden'>
        <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm'>
          <Compass className='h-3.5 w-3.5' aria-hidden />
        </div>
        <span className='text-sm font-semibold text-foreground'>빈방</span>
      </div>

      <div className='hidden items-center gap-2 md:flex'>
        {entityCount > 0 && (
          <span className='rounded-full bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground'>{entityCount}곳</span>
        )}
      </div>

      <div className='flex items-center gap-2'>
        <OnlineStatus />
        {entityCount > 0 && (
          <span className='inline-flex rounded-full bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground md:hidden'>
            {entityCount}곳
          </span>
        )}
        {authStatus === 'authenticated' ? (
          <button
            type='button'
            onClick={() => void signOut({ callbackUrl: '/' })}
            className='inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground md:hidden'
            aria-label='로그아웃'
          >
            <LogOut className='h-4 w-4' aria-hidden />
          </button>
        ) : (
          <button
            type='button'
            onClick={() => void signIn(undefined, { callbackUrl: '/' })}
            className='inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground md:hidden'
            aria-label='로그인'
          >
            <LogIn className='h-4 w-4' aria-hidden />
          </button>
        )}
      </div>
    </header>
  );
}
