'use client';

import { APIProvider, Map as GoogleMap, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MapPin, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MapEntityMarker } from '@/components/map/MapEntityMarker';
import {
  CLUSTER_THRESHOLD,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_LOAD_TIMEOUT_MS,
} from '@/components/map/mapPanelConstants';
import { MapSelectedInfoWindow } from '@/components/map/MapSelectedInfoWindow';
import { LighthouseSpinner } from '@/components/ui/LighthouseSpinner';
import type { MapEntity } from '@/lib/types';

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
  const handleMarkerRef = useCallback((index: number, marker: unknown) => {
    markerRefs.current[index] = marker;
  }, []);

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
      {entities.map((entity, index) => (
        <MapEntityMarker
          key={entity.id}
          entity={entity}
          index={index}
          selectedEntityId={selectedEntityId}
          hoveredEntityId={hoveredEntityId}
          localHoveredId={hoveredId}
          onSetMarkerRef={handleMarkerRef}
          onSetHoveredId={setHoveredId}
          onEntitySelect={onEntitySelect}
          onEntityHover={onEntityHover}
        />
      ))}
      {selectedEntity && (
        <MapSelectedInfoWindow
          selectedEntity={selectedEntity}
          onAlertClick={onAlertClick}
          onCloseInfoWindow={onCloseInfoWindow}
        />
      )}
    </>
  );
}
