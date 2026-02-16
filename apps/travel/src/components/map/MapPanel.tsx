'use client';

import { APIProvider, AdvancedMarker, Map as GoogleMap, Pin, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { useCallback, useEffect, useState } from 'react';

import type { MapEntity } from '@/lib/types';

interface MapPanelProps {
  entities: MapEntity[];
  selectedEntityId?: string;
  onEntitySelect?: (entityId: string) => void;
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

export function MapPanel({ entities, selectedEntityId, onEntitySelect, apiKey }: MapPanelProps) {
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

  return (
    <APIProvider apiKey={apiKey}>
      <GoogleMap
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        mapId='travel-planner-map'
        gestureHandling='greedy'
        disableDefaultUI={false}
        className='h-full w-full'
      >
        <MapContent entities={entities} selectedEntityId={selectedEntityId} onEntitySelect={onEntitySelect} />
      </GoogleMap>
    </APIProvider>
  );
}

interface MapContentProps {
  entities: MapEntity[];
  selectedEntityId?: string;
  onEntitySelect?: (entityId: string) => void;
}

function MapContent({ entities, selectedEntityId, onEntitySelect }: MapContentProps) {
  const map = useMap();
  const isLoaded = useApiIsLoaded();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

  return (
    <>
      {entities.map((entity) => {
        const isSelected = entity.id === selectedEntityId;
        const isHovered = entity.id === hoveredId;
        const colors = TYPE_COLORS[entity.type] ?? TYPE_COLORS.place;
        const scale = isSelected || isHovered ? 1.3 : 1;

        return (
          <AdvancedMarker
            key={entity.id}
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
    </>
  );
}
