'use client';

import { Compass, LogIn, LogOut, Map as MapIcon, MessageSquare } from 'lucide-react';
import { signIn, signOut } from 'next-auth/react';

import type { AuthStatus } from '@/lib/authStatus';
import { usePlaceStore } from '@/stores/usePlaceStore';

interface HomeSidebarProps {
  authStatus: AuthStatus;
}

export function HomeSidebar({ authStatus }: HomeSidebarProps) {
  const { showMap, openChatView, openMapView } = usePlaceStore();

  return (
    <aside className='group hidden md:flex flex-col w-14 hover:w-52 shrink-0 overflow-hidden border-r border-border/60 bg-background transition-[width] duration-200 ease-in-out'>
      <div className='flex h-12 shrink-0 items-center border-b border-border/60'>
        <div className='flex w-14 shrink-0 justify-center'>
          <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm'>
            <Compass className='h-4 w-4' aria-hidden />
          </div>
        </div>
        <span className='flex-1 truncate pr-4 text-sm font-semibold whitespace-nowrap text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
          빈방
        </span>
      </div>

      <ul className='flex flex-col gap-0.5 py-3'>
        <li>
          <button
            type='button'
            onClick={openChatView}
            className={`flex w-full items-center py-2.5 text-sm font-medium transition-colors ${
              !showMap ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            aria-current={!showMap ? 'page' : undefined}
          >
            <span className='flex w-14 shrink-0 justify-center'>
              <MessageSquare className='h-5 w-5' aria-hidden />
            </span>
            <span className='whitespace-nowrap pr-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              채팅
            </span>
          </button>
        </li>
        <li>
          <button
            type='button'
            onClick={openMapView}
            className={`flex w-full items-center py-2.5 text-sm font-medium transition-colors ${
              showMap ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            aria-current={showMap ? 'page' : undefined}
          >
            <span className='flex w-14 shrink-0 justify-center'>
              <MapIcon className='h-5 w-5' aria-hidden />
            </span>
            <span className='whitespace-nowrap pr-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              지도
            </span>
          </button>
        </li>
      </ul>

      <div className='mt-auto border-t border-border/60'>
        {authStatus === 'authenticated' ? (
          <button
            type='button'
            onClick={() => void signOut({ callbackUrl: '/' })}
            className='flex w-full items-center py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground'
            aria-label='로그아웃'
          >
            <span className='flex w-14 shrink-0 justify-center'>
              <LogOut className='h-5 w-5' aria-hidden />
            </span>
            <span className='whitespace-nowrap pr-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              로그아웃
            </span>
          </button>
        ) : (
          <button
            type='button'
            onClick={() => void signIn(undefined, { callbackUrl: '/' })}
            className='flex w-full items-center py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground'
            aria-label='로그인'
          >
            <span className='flex w-14 shrink-0 justify-center'>
              <LogIn className='h-5 w-5' aria-hidden />
            </span>
            <span className='whitespace-nowrap pr-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100'>
              로그인
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
