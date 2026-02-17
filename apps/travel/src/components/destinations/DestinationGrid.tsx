'use client';

import type { Destination } from '@workspace/db';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type DestinationGridProps = {
  destinations: Destination[];
  locale: string;
};

export function DestinationGrid({ destinations, locale }: DestinationGridProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  // 국가 목록 추출
  const countries = ['all', ...Array.from(new Set(destinations.map((d) => d.country)))].sort();

  // 필터링된 여행지
  const filteredDestinations =
    selectedCountry === 'all' ? destinations : destinations.filter((d) => d.country === selectedCountry);

  return (
    <div>
      {/* 국가 필터 */}
      <div className='mb-8'>
        <div className='flex flex-wrap gap-2'>
          {countries.map((country) => (
            <button
              key={country}
              type='button'
              onClick={() => setSelectedCountry(country)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCountry === country
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {country === 'all' ? 'All Destinations' : country}
            </button>
          ))}
        </div>
        <p className='mt-4 text-sm text-muted-foreground'>
          {filteredDestinations.length} {filteredDestinations.length === 1 ? 'destination' : 'destinations'}
        </p>
      </div>

      {/* 여행지 그리드 */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {filteredDestinations.map((destination) => {
          const name = locale === 'ko' ? destination.nameKo : destination.nameEn;
          const description =
            typeof destination.description === 'object' && destination.description !== null
              ? ((destination.description as Record<string, string>)[locale] ?? '')
              : '';

          return (
            <Link
              key={destination.id}
              href={`/${locale}/destinations/${destination.slug}`}
              className='group bg-card border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300'
            >
              {/* 이미지 */}
              <div className='relative aspect-video bg-muted overflow-hidden'>
                {destination.imageUrl ? (
                  <Image
                    src={destination.imageUrl}
                    alt={name}
                    fill
                    className='object-cover group-hover:scale-105 transition-transform duration-300'
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                  />
                ) : (
                  <div className='flex items-center justify-center h-full'>
                    <MapPin className='h-16 w-16 text-muted-foreground/30' />
                  </div>
                )}
                {/* 국가 뱃지 */}
                <div className='absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium'>
                  {destination.country}
                </div>
              </div>

              {/* 콘텐츠 */}
              <div className='p-6'>
                <h3 className='text-xl font-bold mb-2 group-hover:text-primary transition-colors'>{name}</h3>
                <p className='text-sm text-muted-foreground line-clamp-2'>{description}</p>

                {/* 통화 정보 */}
                {destination.currency && (
                  <div className='mt-4 flex items-center gap-2 text-xs text-muted-foreground'>
                    <span className='px-2 py-1 bg-muted rounded'>Currency: {destination.currency}</span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
