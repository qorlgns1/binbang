'use client';

import { Compass, LogIn, LogOut, Map as MapIcon, MessageSquare } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
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
  const [mapHoveredEntityId, setMapHoveredEntityId] = useState<string | undefined>();
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
      if (authStatus === 'loading') return;
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

  const handleMapEntityHover = useCallback((entityId: string | undefined) => {
    setMapHoveredEntityId(entityId);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      {/* Sidebar: Mindtrip-style collapsible left nav (desktop md+) */}
      <aside className='group hidden md:flex flex-col w-14 hover:w-52 shrink-0 overflow-hidden border-r border-border/60 bg-background transition-[width] duration-200 ease-in-out'>
        {/* Brand */}
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

        {/* Nav items */}
        <ul className='flex flex-col gap-0.5 py-3'>
          <li>
            <button
              type='button'
              onClick={() => setShowMap(false)}
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
              onClick={() => setShowMap(true)}
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

        {/* Bottom: auth button */}
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

      {/* Main content */}
      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        {/* Header */}
        <header className='flex h-12 shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-md'>
          {/* Mobile: brand */}
          <div className='flex items-center gap-2 md:hidden'>
            <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm'>
              <Compass className='h-3.5 w-3.5' aria-hidden />
            </div>
            <span className='text-sm font-semibold text-foreground'>빈방</span>
          </div>

          {/* Desktop: entity count */}
          <div className='hidden items-center gap-2 md:flex'>
            {entities.length > 0 && (
              <span className='rounded-full bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground'>
                {entities.length}곳
              </span>
            )}
          </div>

          {/* Right: online status + mobile auth */}
          <div className='flex items-center gap-2'>
            <OnlineStatus />
            {/* Mobile entity count */}
            {entities.length > 0 && (
              <span className='inline-flex rounded-full bg-muted/80 px-2.5 py-1 text-xs text-muted-foreground md:hidden'>
                {entities.length}곳
              </span>
            )}
            {/* Mobile auth */}
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

        {/* Chat + Map split */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Chat Panel */}
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

          {/* Map Panel */}
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

        {/* Mobile: bottom tab bar (Chat / Map) */}
        <nav
          className='flex shrink-0 items-center justify-around border-t border-border/60 bg-background/95 py-3 backdrop-blur-md md:hidden'
          aria-label='채팅과 지도 전환'
        >
          <button
            type='button'
            onClick={() => setShowMap(false)}
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
            onClick={() => setShowMap(true)}
            className={`touch-target flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              showMap ? '-mt-px border-t-2 border-primary text-primary' : 'text-muted-foreground'
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
