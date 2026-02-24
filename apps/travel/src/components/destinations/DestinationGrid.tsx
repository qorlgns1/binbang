'use client';

import type { Destination } from '@workspace/db';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

const ITEMS_PER_PAGE = 12;

type DestinationGridProps = {
  destinations: Destination[];
  locale: string;
};

export function DestinationGrid({ destinations, locale }: DestinationGridProps) {
  const t = useTranslations('destinations');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // 국가 목록 추출
  const sortedCountries = Array.from(new Set(destinations.map((d) => d.country)))
    .filter((country) => country !== 'all')
    .sort((a, b) => a.localeCompare(b, locale));
  const countries = ['all', ...sortedCountries];

  // 필터링된 여행지
  const countryFiltered =
    selectedCountry === 'all' ? destinations : destinations.filter((d) => d.country === selectedCountry);

  const searchFiltered = search.trim()
    ? countryFiltered.filter((d) => {
        const q = search.trim().toLowerCase();
        return (
          d.nameKo.toLowerCase().includes(q) ||
          d.nameEn.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q)
        );
      })
    : countryFiltered;

  const totalPages = Math.max(1, Math.ceil(searchFiltered.length / ITEMS_PER_PAGE));
  const paginatedDestinations = searchFiltered.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setCurrentPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  return (
    <div>
      {/* 검색 바 */}
      <div className='mb-4'>
        <input
          type='text'
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className='w-full px-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50'
        />
      </div>

      {/* 국가 필터 */}
      <div className='mb-8'>
        <div className='flex flex-wrap gap-2'>
          {countries.map((country) => (
            <button
              key={country}
              type='button'
              onClick={() => handleCountryChange(country)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCountry === country
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              {country === 'all' ? t('filterAll') : country}
            </button>
          ))}
        </div>
        <p className='mt-4 text-sm text-muted-foreground'>{t('resultCount', { count: searchFiltered.length })}</p>
      </div>

      {/* 여행지 그리드 */}
      {searchFiltered.length === 0 ? (
        <p className='text-center text-muted-foreground py-12'>{t('noResults')}</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {paginatedDestinations.map((destination) => {
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
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className='mt-8 flex items-center justify-center gap-4'>
          <button
            type='button'
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            {t('prev')}
          </button>
          <span className='text-sm text-muted-foreground'>
            {t('pageInfo', { current: currentPage + 1, total: totalPages })}
          </span>
          <button
            type='button'
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className='px-4 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
