'use client';

import { create } from 'zustand';

import type { MapEntity, PlaceEntity } from '@/lib/types';

interface PlaceState {
  entities: MapEntity[];
  selectedPlaceId: string | undefined;
  hoveredPlaceId: string | undefined;
  mapHoveredEntityId: string | undefined;
  showMap: boolean;
  setEntities: (entities: MapEntity[]) => void;
  selectPlace: (place: PlaceEntity) => void;
  selectEntity: (entityId: string | undefined) => void;
  hoverPlace: (placeId: string | undefined) => void;
  hoverEntity: (entityId: string | undefined) => void;
  openMapView: () => void;
  openChatView: () => void;
}

export const usePlaceStore = create<PlaceState>((set) => ({
  entities: [],
  selectedPlaceId: undefined,
  hoveredPlaceId: undefined,
  mapHoveredEntityId: undefined,
  showMap: true,
  setEntities: (entities) => set({ entities }),
  selectPlace: (place) => set({ selectedPlaceId: place.placeId }),
  selectEntity: (entityId) => set({ selectedPlaceId: entityId }),
  hoverPlace: (placeId) => set({ hoveredPlaceId: placeId }),
  hoverEntity: (entityId) => set({ mapHoveredEntityId: entityId }),
  openMapView: () => set({ showMap: true }),
  openChatView: () => set({ showMap: false }),
}));
