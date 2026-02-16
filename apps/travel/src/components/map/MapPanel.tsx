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
import { useCallback, useEffect, useRef, useState } from 'react';

import type { MapEntity } from '@/lib/types';

const CLUSTER_THRESHOLD = 12;

const MAP_LOAD_TIMEOUT_MS = 15000;

interface MapPanelProps {
  entities: MapEntity[];
  selectedEntityId?: string;
  onEntitySelect?: (entityId: string) => void;
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

export function MapPanel({
  entities,
  selectedEntityId,
  onEntitySelect,
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
          className='flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
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
            onEntitySelect={onEntitySelect}
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
      <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      <p className='text-sm font-medium text-muted-foreground'>지도 불러오는 중...</p>
    </div>
  );
}

interface MapContentProps {
  entities: MapEntity[];
  selectedEntityId?: string;
  onEntitySelect?: (entityId: string) => void;
  onAlertClick?: (entityId: string) => void;
  onCloseInfoWindow?: () => void;
  onLoadTimeout?: () => void;
}

function MapContent({
  entities,
  selectedEntityId,
  onEntitySelect,
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

  markerRefs.current = new Array(entities.length);

  return (
    <>
      {entities.map((entity, index) => {
        const isSelected = entity.id === selectedEntityId;
        const isHovered = entity.id === hoveredId;
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
            onMouseEnter={() => setHoveredId(entity.id)}
            onMouseLeave={() => setHoveredId(null)}
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
          <div className='min-w-[200px] max-w-[280px] p-2 text-left'>
            <h4 className='font-semibold text-sm text-gray-900 dark:text-gray-100 truncate'>{selectedEntity.name}</h4>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize'>{selectedEntity.type}</p>
            <button
              type='button'
              onClick={() => onAlertClick?.(selectedEntity.id)}
              className='mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 px-3 transition-colors'
            >
              <Bell className='h-4 w-4 shrink-0' aria-hidden />
              빈방 알림 설정하기
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}
