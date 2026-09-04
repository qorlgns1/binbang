'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import Image from 'next/image';

import { Loader2, Search, Star, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/** `/api/hotels/search` 가 돌려주는 호텔 한 건. */
export interface HotelSearchResult {
  hotelId: string;
  name: string;
  nameEn: string | null;
  city: string | null;
  country: string | null;
  starRating: number | null;
  photoUrl: string | null;
}

interface HotelSearchInputProps {
  onSelect: (hotel: HotelSearchResult) => void;
  selectedHotel: HotelSearchResult | null;
  onClear: () => void;
  error?: string;
  placeholder: string;
  clearLabel: string;
  /** 크게 보여야 하는 자리(홈 히어로)에서 입력창을 키운다. */
  size?: 'default' | 'lg';
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * 숙소 검색 입력 + 자동완성 드롭다운.
 *
 * 홈 히어로와 알림 등록 폼이 같은 검색 경험을 쓰도록 공용화했다.
 * 문구는 호출부에서 주입한다(홈은 다국어, 앱 내부는 한국어).
 */
export function HotelSearchInput({
  onSelect,
  selectedHotel,
  onClear,
  error,
  placeholder,
  clearLabel,
  size = 'default',
}: HotelSearchInputProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string): Promise<void> => {
    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/hotels/search?q=${encodeURIComponent(q)}&limit=10`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const payload = (await res.json()) as HotelSearchResult[] | { hotels?: HotelSearchResult[] };
        const hotels = Array.isArray(payload) ? payload : Array.isArray(payload.hotels) ? payload.hotels : [];
        setResults(hotels);
        setIsOpen(hotels.length > 0);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void search(query);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  // 외부 클릭 시 드롭다운 닫기 (드롭다운은 portal로 컨테이너 밖에 렌더링되므로 함께 확인)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 드롭다운을 Card 등 조상의 overflow-hidden에 잘리지 않도록 body에 portal하기 위해
  // 입력창 기준 위치를 뷰포트 좌표로 계산해둔다.
  useEffect(() => {
    if (!isOpen || results.length === 0) return;

    function updatePosition(): void {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownRect({ top: rect.bottom, left: rect.left, width: rect.width });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, results.length]);

  if (selectedHotel) {
    return (
      <div
        className='flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3'
        data-testid='selected-hotel-card'
      >
        {selectedHotel.photoUrl && (
          <Image
            src={selectedHotel.photoUrl}
            alt={selectedHotel.name}
            width={56}
            height={56}
            unoptimized
            className='size-14 shrink-0 rounded object-cover'
          />
        )}
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium'>{selectedHotel.name}</p>
          {selectedHotel.nameEn && selectedHotel.nameEn !== selectedHotel.name && (
            <p className='truncate text-xs text-muted-foreground'>{selectedHotel.nameEn}</p>
          )}
          <p className='text-xs text-muted-foreground'>
            {[selectedHotel.city, selectedHotel.country].filter(Boolean).join(', ')}
          </p>
          {selectedHotel.starRating && (
            <div className='mt-0.5 flex items-center gap-0.5'>
              {Array.from({ length: Math.round(selectedHotel.starRating) }).map((_, i) => (
                <Star key={i} className='size-3 fill-amber-400 text-amber-400' />
              ))}
            </div>
          )}
        </div>
        <Button type='button' variant='ghost' size='sm' className='shrink-0 p-1' onClick={onClear}>
          <X className='size-4' />
          <span className='sr-only'>{clearLabel}</span>
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className='relative'>
      <div className='relative'>
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${size === 'lg' ? 'size-5' : 'size-4'}`}
        />
        <Input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`bg-background/80 transition-all focus:bg-background ${size === 'lg' ? 'h-14 pl-11 text-base' : 'pl-9'}`}
          data-testid='hotel-search-input'
        />
        {isSearching && (
          <Loader2 className='absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground' />
        )}
      </div>

      {isOpen &&
        results.length > 0 &&
        dropdownRect &&
        createPortal(
          <div
            ref={dropdownRef}
            className='fixed z-50 overflow-hidden rounded-md border border-border bg-popover shadow-md'
            style={{ top: dropdownRect.top + 4, left: dropdownRect.left, width: dropdownRect.width }}
          >
            <ul className='max-h-64 overflow-y-auto py-1' data-testid='hotel-search-results'>
              {results.map((hotel) => (
                <li key={hotel.hotelId}>
                  <button
                    type='button'
                    className='flex w-full items-start gap-3 px-3 py-2 text-left hover:bg-muted/60'
                    data-testid={`hotel-search-result-${hotel.hotelId}`}
                    onClick={() => {
                      onSelect(hotel);
                      setQuery('');
                      setIsOpen(false);
                    }}
                  >
                    {hotel.photoUrl && (
                      <Image
                        src={hotel.photoUrl}
                        alt={hotel.name}
                        width={40}
                        height={40}
                        unoptimized
                        className='size-10 shrink-0 rounded object-cover'
                      />
                    )}
                    <div className='min-w-0'>
                      <p className='truncate text-sm font-medium'>{hotel.name}</p>
                      <p className='truncate text-xs text-muted-foreground'>
                        {[hotel.city, hotel.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}

      {error && <p className='mt-1 text-xs text-destructive'>{error}</p>}
    </div>
  );
}
