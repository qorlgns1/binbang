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

function isAccommodationPlace(place: PlaceEntity): boolean {
  const types = place.types ?? [];
  return types.some((t) => t === 'lodging' || t === 'hotel');
}

export function PlaceCard({ place, isSelected, onSelect, onAlertClick }: PlaceCardProps) {
  const alertLabel = isAccommodationPlace(place) ? '빈방 알림 설정하기' : '알림 설정하기';
  return (
    <div
      className={`flex flex-col w-full rounded-xl border transition-all duration-300 ease-out overflow-hidden ${
        isSelected
          ? 'border-primary ring-2 ring-primary/30 shadow-2xl scale-[1.02]'
          : 'border-border hover:border-primary/40 hover:shadow-lg'
      } bg-card`}
    >
      <button
        type='button'
        onClick={() => onSelect?.(place)}
        className='flex-1 w-full text-left hover:opacity-95 transition-opacity'
        aria-label={`${place.name} 선택하여 지도에서 보기`}
      >
        {place.photoUrl ? (
          <div className='relative aspect-4/3 w-full overflow-hidden bg-muted'>
            <Image
              src={place.photoUrl}
              alt={place.name}
              fill
              sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
              className='object-cover transition-transform duration-300 hover:scale-105'
              unoptimized
            />
          </div>
        ) : (
          <div className='relative aspect-4/3 w-full bg-muted flex items-center justify-center'>
            <span className='text-muted-foreground text-xs'>이미지 없음</span>
          </div>
        )}
        <div className='p-3 h-[110px] flex flex-col justify-between'>
          {/* 상단: 이름 + 별점 */}
          <div className='space-y-1'>
            <h4 className='font-semibold text-sm text-card-foreground line-clamp-1'>{place.name}</h4>
            {place.rating != null && (
              <div className='flex items-center gap-1'>
                <div className='flex gap-0.5' aria-hidden>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const r = place.rating ?? 0;
                    return (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 shrink-0 ${
                          i <= Math.round(r) ? 'fill-brand-amber text-brand-amber' : 'text-muted/60'
                        }`}
                      />
                    );
                  })}
                </div>
                <span className='text-xs font-medium text-card-foreground'>{place.rating}</span>
                {place.userRatingsTotal != null && (
                  <span className='text-[10px] text-muted-foreground'>({place.userRatingsTotal.toLocaleString()})</span>
                )}
              </div>
            )}
          </div>

          {/* 하단: 주소 + 가격 */}
          <div className='space-y-1'>
            <div className='flex items-start gap-1 text-xs text-muted-foreground'>
              <MapPin className='h-3 w-3 shrink-0 mt-0.5' />
              <span className='line-clamp-1'>{place.address}</span>
            </div>
            {place.priceLevel && (
              <div
                className='flex items-center gap-0.5 text-xs text-muted-foreground'
                title={formatPriceLevel(place.priceLevel)}
              >
                <DollarSign className='h-3 w-3 shrink-0' />
                <span className='font-medium'>{formatPriceLevel(place.priceLevel)}</span>
              </div>
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
          className='w-full flex items-center justify-center gap-2 rounded-lg bg-brand-amber hover:bg-brand-amber/90 active:scale-95 text-white text-sm font-medium py-2.5 transition-all duration-150 shadow-sm hover:shadow-md'
          aria-label={`${place.name}의 ${alertLabel}`}
        >
          <Bell className='h-4 w-4' aria-hidden />
          {alertLabel}
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
