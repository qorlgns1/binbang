'use client';

import { useSession } from 'next-auth/react';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { HomeMobileTabBar } from '@/components/home/HomeMobileTabBar';
import { HomeSidebar } from '@/components/home/HomeSidebar';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { MapPanel } from '@/components/map/MapPanel';
import { LoginPromptModal } from '@/components/modals/LoginPromptModal';
import { useModalStore } from '@/stores/useModalStore';
import { usePlaceStore } from '@/stores/usePlaceStore';

export default function HomePage() {
  const { status: authStatus } = useSession();
  const showMap = usePlaceStore((s) => s.showMap);
  const showLoginModal = useModalStore((s) => s.showLoginModal);
  const loginModalTrigger = useModalStore((s) => s.loginModalTrigger);
  const closeLoginModal = useModalStore((s) => s.closeLoginModal);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <HomeSidebar authStatus={authStatus} />

      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        <HomeTopBar authStatus={authStatus} />

        <div className='flex flex-1 overflow-hidden'>
          <div
            className={`${showMap ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-border/60 bg-card/30 md:w-[42%] lg:max-w-2xl`}
          >
            <ChatPanel />
          </div>

          <div className={`${showMap ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            <MapPanel apiKey={apiKey} />
          </div>
        </div>

        <HomeMobileTabBar />
      </div>

      <LoginPromptModal open={showLoginModal} onClose={closeLoginModal} trigger={loginModalTrigger} />
    </div>
  );
}
