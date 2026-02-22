'use client';

import { Bell, DollarSign, MapPin } from 'lucide-react';
import Image from 'next/image';

import { StarRating } from '@/components/ui/StarRating';

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
  const showAlertButton = isAccommodationPlace(place);
  return (
    <div
      className={`flex flex-col w-full rounded-2xl border transition-all duration-200 overflow-hidden ${
        isSelected
          ? 'border-primary ring-2 ring-primary/25 shadow-lg scale-[1.02]'
          : 'border-border/80 bg-card/90 hover:border-primary/30 hover:shadow-md'
      }`}
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
        <div className='p-3.5 flex flex-col gap-2'>
          {/* 상단: 이름 + 별점 */}
          <div className='space-y-1'>
            <h4 className='font-semibold text-sm text-card-foreground line-clamp-1'>{place.name}</h4>
            {place.rating != null && (
              <div className='flex items-center gap-1'>
                <StarRating rating={place.rating ?? 0} />
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
      {showAlertButton && (
        <div className='px-3 pb-3 pt-0'>
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onAlertClick?.(place);
            }}
            className='w-full flex items-center justify-center gap-2 rounded-full bg-brand-amber hover:bg-brand-amber/90 active:scale-[0.98] text-white text-sm font-medium py-2.5 transition-all duration-200 shadow-sm hover:shadow'
            aria-label={`${place.name}의 빈방 알림 설정하기`}
          >
            <Bell className='h-4 w-4' aria-hidden />
            빈방 알림 설정하기
          </button>
        </div>
      )}
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
