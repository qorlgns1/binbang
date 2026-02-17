'use client';

import { Cloud, DollarSign, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

import { MapPanel } from '@/components/map/MapPanel';

type DestinationDetailProps = {
  destination: {
    name: string;
    description: string;
    highlights: string[];
    country: string;
    imageUrl?: string;
    latitude: number;
    longitude: number;
    currency?: string;
    weather?: Record<string, unknown>;
  };
  locale: string;
};

export function DestinationDetail({ destination, locale: _locale }: DestinationDetailProps) {
  const t = useTranslations();
  const [showMap, setShowMap] = useState(false);

  return (
    <div className='min-h-screen bg-background'>
      {/* 헤더 이미지 */}
      {destination.imageUrl && (
        <div className='relative w-full h-64 md:h-96'>
          <Image src={destination.imageUrl} alt={destination.name} fill className='object-cover' priority />
          <div className='absolute inset-0 bg-gradient-to-t from-background/80 to-transparent' />
          <div className='absolute bottom-0 left-0 right-0 p-6'>
            <div className='container mx-auto'>
              <h1 className='text-4xl md:text-6xl font-bold text-white drop-shadow-lg'>{destination.name}</h1>
              <p className='text-lg text-white/90 mt-2 flex items-center gap-2'>
                <MapPin className='h-5 w-5' />
                {destination.country}
              </p>
            </div>
          </div>
        </div>
      )}

      {!destination.imageUrl && (
        <div className='bg-gradient-to-r from-primary to-brand-amber p-12'>
          <div className='container mx-auto'>
            <h1 className='text-4xl md:text-6xl font-bold text-white'>{destination.name}</h1>
            <p className='text-lg text-white/90 mt-2 flex items-center gap-2'>
              <MapPin className='h-5 w-5' />
              {destination.country}
            </p>
          </div>
        </div>
      )}

      <div className='container mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* 메인 콘텐츠 */}
          <div className='lg:col-span-2 space-y-8'>
            {/* 설명 */}
            <section className='bg-card border border-border rounded-xl p-6'>
              <h2 className='text-2xl font-bold mb-4'>{t('landing.footer.about')}</h2>
              <p className='text-muted-foreground leading-relaxed whitespace-pre-line'>{destination.description}</p>
            </section>

            {/* 하이라이트 */}
            {destination.highlights.length > 0 && (
              <section className='bg-card border border-border rounded-xl p-6'>
                <h2 className='text-2xl font-bold mb-4'>Highlights</h2>
                <ul className='space-y-3'>
                  {destination.highlights.map((highlight) => (
                    <li key={highlight} className='flex items-start gap-3'>
                      <span className='text-primary mt-1'>•</span>
                      <span className='text-muted-foreground'>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* 지도 토글 */}
            <section className='bg-card border border-border rounded-xl p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-2xl font-bold'>{t('place.viewOnMap')}</h2>
                <button
                  type='button'
                  onClick={() => setShowMap(!showMap)}
                  className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
                >
                  {showMap ? t('common.close') : t('place.viewOnMap')}
                </button>
              </div>
              {showMap && (
                <div className='h-96 rounded-lg overflow-hidden border border-border'>
                  <MapPanel
                    entities={[
                      {
                        id: 'destination',
                        name: destination.name,
                        latitude: destination.latitude,
                        longitude: destination.longitude,
                        type: 'attraction',
                        photoUrl: destination.imageUrl,
                      },
                    ]}
                    apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''}
                  />
                </div>
              )}
            </section>
          </div>

          {/* 사이드바 */}
          <div className='space-y-6'>
            {/* 날씨 정보 */}
            {destination.weather && (
              <section className='bg-card border border-border rounded-xl p-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <Cloud className='h-5 w-5 text-primary' />
                  <h3 className='text-xl font-bold'>{t('weather.title')}</h3>
                </div>
                <div className='text-sm text-muted-foreground'>
                  <p>{t('weather.monthly')}</p>
                </div>
              </section>
            )}

            {/* 환율 정보 */}
            {destination.currency && (
              <section className='bg-card border border-border rounded-xl p-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <DollarSign className='h-5 w-5 text-primary' />
                  <h3 className='text-xl font-bold'>{t('exchange.title')}</h3>
                </div>
                <div className='text-sm text-muted-foreground'>
                  <p>{t('exchange.base')}: USD</p>
                  <p>
                    {t('exchange.target')}: {destination.currency}
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
