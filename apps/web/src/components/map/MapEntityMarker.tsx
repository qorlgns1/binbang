'use client';

import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

import { TYPE_COLORS } from '@/components/map/mapPanelConstants';
import type { MapEntity } from '@/lib/types';

interface MapEntityMarkerProps {
  entity: MapEntity;
  index: number;
  selectedEntityId?: string;
  hoveredEntityId?: string;
  localHoveredId: string | null;
  onSetMarkerRef: (index: number, marker: unknown) => void;
  onSetHoveredId: (entityId: string | null) => void;
  onEntitySelect?: (entityId: string) => void;
  onEntityHover?: (entityId: string | undefined) => void;
}

export function MapEntityMarker({
  entity,
  index,
  selectedEntityId,
  hoveredEntityId,
  localHoveredId,
  onSetMarkerRef,
  onSetHoveredId,
  onEntitySelect,
  onEntityHover,
}: MapEntityMarkerProps) {
  const isSelected = entity.id === selectedEntityId;
  const isHovered = entity.id === localHoveredId || entity.id === hoveredEntityId;
  const colors = TYPE_COLORS[entity.type] ?? TYPE_COLORS.place;
  const scale = isSelected || isHovered ? 1.3 : 1;

  return (
    <AdvancedMarker
      ref={(marker) => {
        onSetMarkerRef(index, marker);
      }}
      position={{ lat: entity.latitude, lng: entity.longitude }}
      title={entity.name}
      onClick={() => onEntitySelect?.(entity.id)}
      onMouseEnter={() => {
        onSetHoveredId(entity.id);
        onEntityHover?.(entity.id);
      }}
      onMouseLeave={() => {
        onSetHoveredId(null);
        onEntityHover?.(undefined);
      }}
    >
      <div data-testid={`map-marker-${entity.id}`} data-marker-scale={String(scale)}>
        <Pin background={colors.background} glyphColor={colors.glyph} scale={scale} />
      </div>
    </AdvancedMarker>
  );
}
