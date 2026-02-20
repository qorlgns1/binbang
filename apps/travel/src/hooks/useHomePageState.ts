'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import type { MapEntity, PlaceEntity } from '@/lib/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface UseHomePageStateOptions {
  authStatus: AuthStatus;
}

export function useHomePageState({ authStatus }: UseHomePageStateOptions) {
  const [entities, setEntities] = useState<MapEntity[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>();
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | undefined>();
  const [mapHoveredEntityId, setMapHoveredEntityId] = useState<string | undefined>();
  const [showMap, setShowMap] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const openChatView = useCallback(() => {
    setShowMap(false);
  }, []);

  const openMapView = useCallback(() => {
    setShowMap(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

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
      if (authStatus === 'loading') {
        return;
      }

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

  return {
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
  };
}
