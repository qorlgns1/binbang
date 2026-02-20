'use client';

import { Map as MapIcon, MessageSquare } from 'lucide-react';

interface HomeMobileTabBarProps {
  showMap: boolean;
  onShowChat: () => void;
  onShowMap: () => void;
}

export function HomeMobileTabBar({ showMap, onShowChat, onShowMap }: HomeMobileTabBarProps) {
  return (
    <nav
      className='flex shrink-0 items-center justify-around border-t border-border/60 bg-background/95 py-3 backdrop-blur-md md:hidden'
      aria-label='채팅과 지도 전환'
    >
      <button
        type='button'
        onClick={onShowChat}
        className={`touch-target flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
          !showMap ? '-mt-px border-t-2 border-primary text-primary' : 'text-muted-foreground'
        }`}
        aria-current={!showMap ? 'page' : undefined}
      >
        <MessageSquare className='h-5 w-5' aria-hidden />
        채팅
      </button>
      <button
        type='button'
        onClick={onShowMap}
        className={`touch-target flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
          showMap ? '-mt-px border-t-2 border-primary text-primary' : 'text-muted-foreground'
        }`}
        aria-current={showMap ? 'page' : undefined}
      >
        <MapIcon className='h-5 w-5' aria-hidden />
        지도
      </button>
    </nav>
  );
}
