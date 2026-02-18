'use client';

import { Compass, Map as MapIcon, MessageSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { MapPanel } from '@/components/map/MapPanel';
import { LoginPromptModal } from '@/components/modals/LoginPromptModal';
import { OnlineStatus } from '@/components/OnlineStatus';
import type { MapEntity, PlaceEntity } from '@/lib/types';

export default function HomePage() {
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | undefined>();
  const [showMap, setShowMap] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { status: authStatus } = useSession();

  const handleEntitiesUpdate = useCallback((newEntities: MapEntity[]) => {
    setEntities(newEntities);
  }, []);

  const handlePlaceSelect = useCallback((place: PlaceEntity) => {
    setSelectedPlaceId(place.placeId);
  }, []);

  const handleMapEntitySelect = useCallback((entityId: string) => {
    setSelectedPlaceId(entityId);
  }, []);

  const handleMapAlertClick = useCallback(
    (_entityId: string) => {
      if (authStatus === 'authenticated') {
        toast.info('빈방 알림 기능은 준비 중이에요.');
        return;
      }

      setShowLoginModal(true);
    },
    [authStatus],
  );

  const handleCloseMapInfo = useCallback(() => {
    setSelectedPlaceId(undefined);
  }, []);

  const handlePlaceHover = useCallback((placeId: string | undefined) => {
    setHoveredPlaceId(placeId);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return (
    <div className='flex h-screen flex-col'>
      {/* Header: compact on mobile */}
      <header className='flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-3 py-2 md:px-4 md:py-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary md:h-8 md:w-8'>
            <Compass className='h-4 w-4 text-primary-foreground md:h-5 md:w-5' />
          </div>
          <h1 className='truncate text-base font-bold md:text-lg'>빈방</h1>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          <OnlineStatus />
          {entities.length > 0 && (
            <span className='text-xs text-muted-foreground bg-muted hidden rounded-full px-2 py-1 sm:inline-flex'>
              {entities.length}곳
            </span>
          )}
        </div>
      </header>

      {/* Main Content: Chat + Map split (desktop) / single view + bottom tabs (mobile) */}
      <div className='flex flex-1 flex-col overflow-hidden'>
        <div className='flex flex-1 overflow-hidden'>
          {/* Chat Panel */}
          <div
            className={`${showMap ? 'hidden md:flex' : 'flex'} flex-1 flex-col border-r border-border md:w-[42%] lg:max-w-2xl`}
          >
            <ChatPanel
              onEntitiesUpdate={handleEntitiesUpdate}
              onPlaceSelect={handlePlaceSelect}
              onPlaceHover={handlePlaceHover}
              selectedPlaceId={selectedPlaceId}
            />
          </div>

          {/* Map Panel */}
          <div className={`${showMap ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            <MapPanel
              entities={entities}
              selectedEntityId={selectedPlaceId}
              hoveredEntityId={hoveredPlaceId}
              onEntitySelect={handleMapEntitySelect}
              onAlertClick={handleMapAlertClick}
              onCloseInfoWindow={handleCloseMapInfo}
              apiKey={apiKey}
            />
          </div>
        </div>

        {/* Mobile: bottom tab bar (Chat / Map) */}
        <nav
          className='md:hidden flex shrink-0 items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm py-3'
          aria-label='채팅과 지도 전환'
        >
          <button
            type='button'
            onClick={() => setShowMap(false)}
            className={`touch-target flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              !showMap ? 'text-primary border-t-2 border-primary -mt-px' : 'text-muted-foreground'
            }`}
            aria-current={!showMap ? 'page' : undefined}
          >
            <MessageSquare className='h-5 w-5' aria-hidden />
            채팅
          </button>
          <button
            type='button'
            onClick={() => setShowMap(true)}
            className={`touch-target flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              showMap ? 'text-primary border-t-2 border-primary -mt-px' : 'text-muted-foreground'
            }`}
            aria-current={showMap ? 'page' : undefined}
          >
            <MapIcon className='h-5 w-5' aria-hidden />
            지도
          </button>
        </nav>
      </div>
      <LoginPromptModal open={showLoginModal} onClose={() => setShowLoginModal(false)} trigger='bookmark' />
    </div>
  );
}
