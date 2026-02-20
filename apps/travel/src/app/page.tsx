'use client';

import { useSession } from 'next-auth/react';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { HomeMobileTabBar } from '@/components/home/HomeMobileTabBar';
import { HomeSidebar } from '@/components/home/HomeSidebar';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { MapPanel } from '@/components/map/MapPanel';
import { LoginPromptModal } from '@/components/modals/LoginPromptModal';
import { useHomePageState } from '@/hooks/useHomePageState';

export default function HomePage() {
  const { status: authStatus } = useSession();
  const {
    entities,
    hoveredPlaceId,
    mapHoveredEntityId,
    selectedPlaceId,
    showLoginModal,
    showMap,
    closeLoginModal,
    handleCloseMapInfo,
    handleEntitiesUpdate,
    handleMapAlertClick,
    handleMapEntityHover,
    handleMapEntitySelect,
    handlePlaceHover,
    handlePlaceSelect,
    openChatView,
    openMapView,
  } = useHomePageState({
    authStatus,
  });

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <HomeSidebar authStatus={authStatus} showMap={showMap} onShowChat={openChatView} onShowMap={openMapView} />

      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        <HomeTopBar authStatus={authStatus} entityCount={entities.length} />

        <div className='flex flex-1 overflow-hidden'>
          <div
            className={`${showMap ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-border/60 bg-card/30 md:w-[42%] lg:max-w-2xl`}
          >
            <ChatPanel
              onEntitiesUpdate={handleEntitiesUpdate}
              onPlaceSelect={handlePlaceSelect}
              onPlaceHover={handlePlaceHover}
              selectedPlaceId={selectedPlaceId}
              mapHoveredEntityId={mapHoveredEntityId}
            />
          </div>

          <div className={`${showMap ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            <MapPanel
              entities={entities}
              selectedEntityId={selectedPlaceId}
              hoveredEntityId={hoveredPlaceId}
              onEntitySelect={handleMapEntitySelect}
              onEntityHover={handleMapEntityHover}
              onAlertClick={handleMapAlertClick}
              onCloseInfoWindow={handleCloseMapInfo}
              apiKey={apiKey}
            />
          </div>
        </div>

        <HomeMobileTabBar showMap={showMap} onShowChat={openChatView} onShowMap={openMapView} />
      </div>

      <LoginPromptModal open={showLoginModal} onClose={closeLoginModal} trigger='bookmark' />
    </div>
  );
}
