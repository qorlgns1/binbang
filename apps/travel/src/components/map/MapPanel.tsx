'use client';

import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useMap,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Bell, MapPin, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { MapEntity } from '@/lib/types';
import { LighthouseSpinner } from '@/components/ui/LighthouseSpinner';

const CLUSTER_THRESHOLD = 12;

const MAP_LOAD_TIMEOUT_MS = 15000;

interface MapPanelProps {
  entities: MapEntity[];
  selectedEntityId?: string;
  hoveredEntityId?: string;
  onEntitySelect?: (entityId: string) => void;
  onEntityHover?: (entityId: string | undefined) => void;
  onAlertClick?: (entityId: string) => void;
  onCloseInfoWindow?: () => void;
  apiKey: string;
}

const DEFAULT_CENTER = { lat: 20, lng: 100 };
const DEFAULT_ZOOM = 3;

const TYPE_COLORS: Record<string, { background: string; glyph: string }> = {
  place: { background: '#2563eb', glyph: '#ffffff' },
  restaurant: { background: '#f97316', glyph: '#ffffff' },
  accommodation: { background: '#8b5cf6', glyph: '#ffffff' },
  attraction: { background: '#10b981', glyph: '#ffffff' },
};

const TYPE_LABELS: Record<string, string> = {
  place: '장소',
  restaurant: '음식점',
  accommodation: '숙소',
  attraction: '관광지',
};

export function MapPanel({
  entities,
  selectedEntityId,
  hoveredEntityId,
  onEntitySelect,
  onEntityHover,
  onAlertClick,
  onCloseInfoWindow,
  apiKey,
}: MapPanelProps) {
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  if (!apiKey) {
    return (
      <div className='flex h-full items-center justify-center bg-muted/30'>
        <div className='text-center text-muted-foreground'>
          <p className='text-lg font-medium'>Map Unavailable</p>
          <p className='text-sm mt-1'>Google Maps API key is not configured</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-4 bg-muted/30 px-4'>
        <div className='flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10'>
          <MapPin className='h-7 w-7 text-destructive' aria-hidden />
        </div>
        <p className='text-center font-medium text-foreground'>지도를 불러오지 못했어요</p>
        <p className='text-center text-sm text-muted-foreground'>네트워크를 확인한 뒤 다시 시도해 주세요.</p>
        <button
          type='button'
          onClick={() => {
            setLoadError(false);
            setRetryKey((k: number) => k + 1);
          }}
          className='flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all duration-150'
          aria-label='지도 다시 불러오기'
        >
          <RefreshCw className='h-4 w-4' aria-hidden />
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} key={retryKey}>
      <div className='relative h-full w-full'>
        <GoogleMap
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={DEFAULT_ZOOM}
          mapId='travel-planner-map'
          gestureHandling='greedy'
          disableDefaultUI={false}
          className='h-full w-full'
        >
          <MapContent
            entities={entities}
            selectedEntityId={selectedEntityId}
            hoveredEntityId={hoveredEntityId}
            onEntitySelect={onEntitySelect}
            onEntityHover={onEntityHover}
            onAlertClick={onAlertClick}
            onCloseInfoWindow={onCloseInfoWindow}
            onLoadTimeout={() => setLoadError(true)}
          />
        </GoogleMap>
        <MapLoadingOverlay />
      </div>
    </APIProvider>
  );
}

function MapLoadingOverlay() {
  const isLoaded = useApiIsLoaded();
  if (isLoaded) return null;
  return (
    <div
      className='absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm'
      aria-live='polite'
      aria-busy='true'
    >
      <LighthouseSpinner size='lg' />
      <p className='text-sm font-medium text-muted-foreground'>어둠 속에서 길을 찾고 있어요...</p>
    </div>
  );
}

interface MapContentProps {
  entities: MapEntity[];
  selectedEntityId?: string;
  hoveredEntityId?: string;
  onEntitySelect?: (entityId: string) => void;
  onEntityHover?: (entityId: string | undefined) => void;
  onAlertClick?: (entityId: string) => void;
  onCloseInfoWindow?: () => void;
  onLoadTimeout?: () => void;
}

function MapContent({
  entities,
  selectedEntityId,
  hoveredEntityId,
  onEntitySelect,
  onEntityHover,
  onAlertClick,
  onCloseInfoWindow,
  onLoadTimeout,
}: MapContentProps) {
  const map = useMap();
  const isLoaded = useApiIsLoaded();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectedEntity = selectedEntityId ? entities.find((e) => e.id === selectedEntityId) : undefined;
  const markerRefs = useRef<unknown[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => onLoadTimeout?.(), MAP_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [isLoaded, onLoadTimeout]);

  useEffect(() => {
    if (!map || !isLoaded || entities.length <= CLUSTER_THRESHOLD) {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
      return;
    }
    const timer = setTimeout(() => {
      const markers = markerRefs.current.filter(Boolean);
      if (markers.length === 0) return;
      clustererRef.current?.clearMarkers();
      clustererRef.current = new MarkerClusterer({ map, markers });
    }, 0);
    return () => {
      clearTimeout(timer);
      clustererRef.current?.clearMarkers();
      clustererRef.current = null;
    };
  }, [map, isLoaded, entities]);

  const fitEntities = useCallback(() => {
    if (!map || !isLoaded || entities.length === 0) return;

    if (entities.length === 1) {
      map.panTo({ lat: entities[0].latitude, lng: entities[0].longitude });
      map.setZoom(14);
      return;
    }

    try {
      const g = (globalThis as unknown as Record<string, unknown>).google as
        | { maps: { LatLngBounds: new () => { extend: (pos: { lat: number; lng: number }) => void } } }
        | undefined;
      if (g?.maps?.LatLngBounds) {
        const bounds = new g.maps.LatLngBounds();
        for (const entity of entities) {
          bounds.extend({ lat: entity.latitude, lng: entity.longitude });
        }
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    } catch {
      // Google Maps API not loaded yet
    }
  }, [map, isLoaded, entities]);

  useEffect(() => {
    fitEntities();
  }, [fitEntities]);

  const handleSelectedEntity = useCallback(() => {
    if (!map || !selectedEntityId) return;
    const entity = entities.find((e) => e.id === selectedEntityId);
    if (entity) {
      map.panTo({ lat: entity.latitude, lng: entity.longitude });
      map.setZoom(15);
    }
  }, [map, selectedEntityId, entities]);

  useEffect(() => {
    handleSelectedEntity();
  }, [handleSelectedEntity]);

  useEffect(() => {
    if (!map || !onCloseInfoWindow) return;
    const handler = () => onCloseInfoWindow();
    const g = (
      globalThis as unknown as {
        google?: {
          maps?: {
            event?: {
              addListener: (target: unknown, name: string, fn: () => void) => { remove: () => void };
              removeListener: (listener: { remove: () => void }) => void;
            };
          };
        };
      }
    ).google;
    const listener = g?.maps?.event?.addListener(map, 'click', handler);
    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [map, onCloseInfoWindow]);

  return (
    <>
      {entities.map((entity, index) => {
        const isSelected = entity.id === selectedEntityId;
        const isHovered = entity.id === hoveredId || entity.id === hoveredEntityId;
        const colors = TYPE_COLORS[entity.type] ?? TYPE_COLORS.place;
        const scale = isSelected || isHovered ? 1.3 : 1;

        return (
          <AdvancedMarker
            key={entity.id}
            ref={(el: unknown) => {
              markerRefs.current[index] = el;
            }}
            position={{ lat: entity.latitude, lng: entity.longitude }}
            title={entity.name}
            onClick={() => onEntitySelect?.(entity.id)}
            onMouseEnter={() => { setHoveredId(entity.id); onEntityHover?.(entity.id); }}
            onMouseLeave={() => { setHoveredId(null); onEntityHover?.(undefined); }}
          >
            <Pin background={colors.background} glyphColor={colors.glyph} scale={scale} />
          </AdvancedMarker>
        );
      })}
      {selectedEntity && (
        <InfoWindow
          position={{ lat: selectedEntity.latitude, lng: selectedEntity.longitude }}
          onCloseClick={() => onCloseInfoWindow?.()}
        >
          <div className='w-[220px]'>
            {selectedEntity.photoUrl && (
              <div className='relative mb-3 aspect-video w-full overflow-hidden rounded-lg bg-muted'>
                <Image
                  src={selectedEntity.photoUrl}
                  alt={selectedEntity.name}
                  fill
                  sizes='220px'
                  className='object-cover'
                  unoptimized
                />
              </div>
            )}
            <div className='space-y-2.5'>
              <div className='flex items-start gap-2'>
                <span
                  className='mt-1 h-2.5 w-2.5 shrink-0 rounded-full'
                  style={{ backgroundColor: TYPE_COLORS[selectedEntity.type]?.background ?? '#2563eb' }}
                />
                <div className='min-w-0'>
                  <h4 className='truncate text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100'>
                    {selectedEntity.name}
                  </h4>
                  <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>
                    {TYPE_LABELS[selectedEntity.type] ?? selectedEntity.type}
                  </p>
                </div>
              </div>
              {selectedEntity.type === 'accommodation' && (
                <button
                  type='button'
                  onClick={() => onAlertClick?.(selectedEntity.id)}
                  className='w-full flex items-center justify-center gap-1.5 rounded-full bg-brand-amber hover:bg-brand-amber/90 active:scale-95 text-white text-xs font-medium py-2 transition-all duration-150'
                  aria-label={`${selectedEntity.name}의 빈방 알림 설정하기`}
                >
                  <Bell className='h-3.5 w-3.5 shrink-0' aria-hidden />
                  빈방 알림 설정하기
                </button>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
