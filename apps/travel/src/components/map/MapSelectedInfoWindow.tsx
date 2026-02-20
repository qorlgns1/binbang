'use client';

import { Bell } from 'lucide-react';
import Image from 'next/image';
import { InfoWindow } from '@vis.gl/react-google-maps';

import { TYPE_COLORS, TYPE_LABELS } from '@/components/map/mapPanelConstants';
import type { MapEntity } from '@/lib/types';

interface MapSelectedInfoWindowProps {
  selectedEntity: MapEntity;
  onAlertClick?: (entityId: string) => void;
  onCloseInfoWindow?: () => void;
}

export function MapSelectedInfoWindow({ selectedEntity, onAlertClick, onCloseInfoWindow }: MapSelectedInfoWindowProps) {
  return (
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
  );
}
