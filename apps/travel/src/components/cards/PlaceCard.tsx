'use client';

import { Bell, DollarSign, MapPin, Star } from 'lucide-react';
import Image from 'next/image';

import type { PlaceEntity } from '@/lib/types';

interface PlaceCardProps {
  place: PlaceEntity;
  isSelected?: boolean;
  onSelect?: (place: PlaceEntity) => void;
  onAlertClick?: (place: PlaceEntity) => void;
}

export function PlaceCard({ place, isSelected, onSelect, onAlertClick }: PlaceCardProps) {
  return (
    <div
      className={`w-full rounded-xl border transition-all duration-200 overflow-hidden ${
        isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/40'
      } bg-card`}
    >
      <button
        type='button'
        onClick={() => onSelect?.(place)}
        className='w-full text-left hover:opacity-95 transition-opacity'
      >
        {place.photoUrl && (
          <div className='relative aspect-[4/3] w-full overflow-hidden bg-muted'>
            <Image
              src={place.photoUrl}
              alt={place.name}
              fill
              sizes='(max-width: 640px) 100vw, 50vw'
              className='object-cover transition-transform duration-300 hover:scale-105'
              unoptimized
            />
          </div>
        )}
        <div className='p-3'>
          <h4 className='font-semibold text-sm text-card-foreground truncate'>{place.name}</h4>
          <div className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
            <MapPin className='h-3 w-3 shrink-0' />
            <span className='truncate'>{place.address}</span>
          </div>
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            {place.rating != null && (
              <div className='flex items-center gap-1'>
                <div className='flex gap-0.5' aria-hidden>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const r = place.rating ?? 0;
                    return (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 shrink-0 ${
                          i <= Math.round(r) ? 'fill-amber-400 text-amber-400' : 'text-muted/60'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className='text-xs font-medium text-card-foreground'>{place.rating}</span>
                {place.userRatingsTotal != null && (
                  <span className='text-xs text-muted-foreground'>({place.userRatingsTotal.toLocaleString()})</span>
                )}
              </div>
            )}
            {place.priceLevel && (
              <span className='flex items-center gap-0.5 text-xs text-muted-foreground' title={formatPriceLevel(place.priceLevel)}>
                <DollarSign className='h-3 w-3 shrink-0' />
                {formatPriceLevel(place.priceLevel)}
              </span>
            )}
          </div>
        </div>
      </button>
      <div className='px-3 pb-3 pt-0'>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onAlertClick?.(place);
          }}
          className='w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2.5 transition-colors shadow-sm'
        >
          <Bell className='h-4 w-4' aria-hidden />
          빈방 알림 설정하기
        </button>
      </div>
    </div>
  );
}

function formatPriceLevel(level: string): string {
  switch (level) {
    case 'PRICE_LEVEL_FREE':
      return 'Free';
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$';
    case 'PRICE_LEVEL_MODERATE':
      return '$$';
    case 'PRICE_LEVEL_EXPENSIVE':
      return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$$';
    default:
      return level;
  }
}
