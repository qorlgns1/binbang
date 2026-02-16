'use client';

import { Compass, Map as MapIcon, MessageSquare } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ChatPanel } from '@/components/chat/ChatPanel';
import { MapPanel } from '@/components/map/MapPanel';
import type { MapEntity, PlaceEntity } from '@/lib/types';

export default function HomePage() {
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const [showMap, setShowMap] = useState(true);

  const handleEntitiesUpdate = useCallback((newEntities: MapEntity[]) => {
    setEntities(newEntities);
  }, []);

  const handlePlaceSelect = useCallback((place: PlaceEntity) => {
    setSelectedPlaceId(place.placeId);
  }, []);

  const handleMapEntitySelect = useCallback((entityId: string) => {
    setSelectedPlaceId(entityId);
  }, []);

  const handleMapAlertClick = useCallback((_entityId: string) => {
    toast.info('빈방 알림 기능은 준비 중이에요.');
  }, []);

  const handleCloseMapInfo = useCallback(() => {
    setSelectedPlaceId(undefined);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return (
    <div className='flex h-screen flex-col'>
      {/* Header */}
      <header className='flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3'>
        <div className='flex items-center gap-2'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary'>
            <Compass className='h-5 w-5 text-primary-foreground' />
          </div>
          <h1 className='text-lg font-bold'>AI Travel Planner</h1>
        </div>
        <div className='flex items-center gap-2'>
          {entities.length > 0 && (
            <span className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full'>
              {entities.length} places on map
            </span>
          )}
          {/* Mobile map toggle */}
          <button
            type='button'
            onClick={() => setShowMap(!showMap)}
            className='md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors'
          >
            {showMap ? <MessageSquare className='h-4 w-4' /> : <MapIcon className='h-4 w-4' />}
          </button>
        </div>
      </header>

      {/* Main Content: Chat + Map split */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Chat Panel */}
        <div
          className={`${showMap ? 'hidden md:flex' : 'flex'} flex-1 md:w-1/2 md:max-w-2xl flex-col border-r border-border`}
        >
          <ChatPanel
            onEntitiesUpdate={handleEntitiesUpdate}
            onPlaceSelect={handlePlaceSelect}
            selectedPlaceId={selectedPlaceId}
          />
        </div>

        {/* Map Panel */}
        <div className={`${showMap ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
          <MapPanel
            entities={entities}
            selectedEntityId={selectedPlaceId}
            onEntitySelect={handleMapEntitySelect}
            onAlertClick={handleMapAlertClick}
            onCloseInfoWindow={handleCloseMapInfo}
            apiKey={apiKey}
          />
        </div>
      </div>
    </div>
  );
}
