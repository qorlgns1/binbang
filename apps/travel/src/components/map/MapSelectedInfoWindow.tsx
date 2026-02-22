'use client';

import { Bell } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { InfoWindow } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';

import { TYPE_COLORS, TYPE_LABELS } from '@/components/map/mapPanelConstants';
import type { MapEntity } from '@/lib/types';
import { useModalStore } from '@/stores/useModalStore';
import { usePlaceStore } from '@/stores/usePlaceStore';

interface MapSelectedInfoWindowProps {
  selectedEntity: MapEntity;
}

export function MapSelectedInfoWindow({ selectedEntity }: MapSelectedInfoWindowProps) {
  const selectEntity = usePlaceStore((s) => s.selectEntity);
  const openLoginModal = useModalStore((s) => s.openLoginModal);
  const { status: authStatus } = useSession();

  const handleAlertClick = () => {
    if (authStatus === 'authenticated') {
      toast.info('빈방 알림 기능은 준비 중이에요.');
      return;
    }
    openLoginModal('bookmark');
  };

  return (
    <InfoWindow
      position={{ lat: selectedEntity.latitude, lng: selectedEntity.longitude }}
      onCloseClick={() => selectEntity(undefined)}
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
              onClick={handleAlertClick}
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
  );
}
