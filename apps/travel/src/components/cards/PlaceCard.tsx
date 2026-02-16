'use client';

import { MapPin, Star } from 'lucide-react';
import Image from 'next/image';

import type { PlaceEntity } from '@/lib/types';

interface PlaceCardProps {
  place: PlaceEntity;
  isSelected?: boolean;
  onSelect?: (place: PlaceEntity) => void;
}

export function PlaceCard({ place, isSelected, onSelect }: PlaceCardProps) {
  return (
    <button
      type='button'
      onClick={() => onSelect?.(place)}
      className={`w-full text-left rounded-xl border transition-all duration-200 hover:shadow-md ${
        isSelected ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-border hover:border-primary/40'
      } bg-card overflow-hidden`}
    >
      {place.photoUrl && (
        <div className='relative h-32 w-full overflow-hidden'>
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
        <div className='flex items-center gap-1 mt-1 text-xs text-muted-foreground'>
          <MapPin className='h-3 w-3 shrink-0' />
          <span className='truncate'>{place.address}</span>
        </div>
        <div className='flex items-center gap-2 mt-2'>
          {place.rating && (
            <div className='flex items-center gap-0.5'>
              <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
              <span className='text-xs font-medium'>{place.rating}</span>
              {place.userRatingsTotal && (
                <span className='text-xs text-muted-foreground'>({place.userRatingsTotal.toLocaleString()})</span>
              )}
            </div>
          )}
          {place.priceLevel && (
            <span className='text-xs text-muted-foreground'>{formatPriceLevel(place.priceLevel)}</span>
          )}
        </div>
      </div>
    </button>
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
