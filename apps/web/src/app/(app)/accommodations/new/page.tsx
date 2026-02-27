'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ArrowLeft, Bell, Loader2, Search, Star, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAgodaAlertMutation } from '@/features/accommodations';
import { ApiError, getUserMessage, getValidationFieldErrors } from '@/lib/apiError';

// ============================================================================
// Types
// ============================================================================

interface HotelSearchResult {
  hotelId: string;
  name: string;
  nameEn: string | null;
  city: string | null;
  country: string | null;
  starRating: number | null;
  photoUrl: string | null;
}

type FormField = 'platformId' | 'name' | 'checkIn' | 'checkOut' | 'adults' | 'children' | 'rooms' | 'consentOptIn';

// ============================================================================
// Hotel Search Component
// ============================================================================

interface HotelSearchInputProps {
  onSelect: (hotel: HotelSearchResult) => void;
  selectedHotel: HotelSearchResult | null;
  onClear: () => void;
  error?: string;
}

function HotelSearchInput({ onSelect, selectedHotel, onClear, error }: HotelSearchInputProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string): Promise<void> => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/hotels/search?q=${encodeURIComponent(q)}&limit=10`);
      if (res.ok) {
        const payload = (await res.json()) as HotelSearchResult[] | { hotels?: HotelSearchResult[] };
        const hotels = Array.isArray(payload) ? payload : Array.isArray(payload.hotels) ? payload.hotels : [];
        setResults(hotels);
        setIsOpen(hotels.length > 0);
      }
    } catch {
      // 검색 실패 시 결과 없음으로 처리
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void search(query);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedHotel) {
    return (
      <div
        className='flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3'
        data-testid='selected-hotel-card'
      >
        {selectedHotel.photoUrl && (
          <img
            src={selectedHotel.photoUrl}
            alt={selectedHotel.name}
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
                // biome-ignore lint/suspicious/noArrayIndexKey: static render
                <Star key={i} className='size-3 fill-amber-400 text-amber-400' />
              ))}
            </div>
          )}
        </div>
        <Button type='button' variant='ghost' size='sm' className='shrink-0 p-1' onClick={onClear}>
          <X className='size-4' />
          <span className='sr-only'>선택 해제</span>
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className='relative'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder='호텔명, 도시명으로 검색...'
          className='bg-background/80 pl-9 transition-all focus:bg-background'
          data-testid='hotel-search-input'
        />
        {isSearching && (
          <Loader2 className='absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground' />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className='absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md'>
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
                    <img src={hotel.photoUrl} alt={hotel.name} className='size-10 shrink-0 rounded object-cover' />
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
        </div>
      )}

      {error && <p className='mt-1 text-xs text-destructive'>{error}</p>}
    </div>
  );
}

// ============================================================================
// Page
// ============================================================================

export default function NewAccommodationPage(): React.ReactElement {
  const router = useRouter();
  const createMutation = useCreateAgodaAlertMutation();

  const [selectedHotel, setSelectedHotel] = useState<HotelSearchResult | null>(null);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [consentOptIn, setConsentOptIn] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});

  useEffect(() => {
    if (!createMutation.error) return;
    const errors = getValidationFieldErrors(createMutation.error);
    if (!errors) return;
    setFieldErrors({
      platformId: errors.platformId,
      name: errors.name,
      checkIn: errors.checkIn,
      checkOut: errors.checkOut,
      adults: errors.adults,
      children: errors.children,
      rooms: errors.rooms,
      consentOptIn: errors.consentOptIn,
    });
  }, [createMutation.error]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();

    if (!selectedHotel) {
      setFieldErrors((prev) => ({ ...prev, platformId: '호텔을 선택해주세요' }));
      return;
    }

    if (!consentOptIn) {
      setFieldErrors((prev) => ({ ...prev, consentOptIn: '알림 수신 동의가 필요합니다' }));
      return;
    }

    createMutation.mutate(
      {
        platformId: selectedHotel.hotelId,
        name: selectedHotel.name,
        checkIn,
        checkOut,
        adults,
        children,
        rooms,
        currency: 'KRW',
        locale: 'ko',
        consentOptIn: true,
      },
      {
        onSuccess: () => {
          router.push('/dashboard');
          router.refresh();
        },
      },
    );
  }

  return (
    <main className='mx-auto max-w-2xl px-4 py-8'>
      {/* 뒤로 가기 */}
      <div className='mb-6'>
        <Button asChild variant='ghost' size='sm' className='gap-2 px-0 text-muted-foreground hover:text-foreground'>
          <Link href='/dashboard'>
            <ArrowLeft className='size-4' />
            대시보드로 돌아가기
          </Link>
        </Button>
      </div>

      {/* 히어로 섹션 */}
      <div className='mb-8 text-center'>
        <div className='mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10'>
          <Bell className='size-8 text-primary' />
        </div>
        <h1 className='mb-3 text-3xl font-semibold text-foreground'>알림 등록</h1>
        <p className='text-muted-foreground'>빈방 또는 가격 하락 알림을 받을 숙소를 검색해 등록하세요.</p>
      </div>

      <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
        <CardHeader>
          <CardTitle>호텔 정보</CardTitle>
          <CardDescription>모든 필수 항목(*)을 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          {createMutation.error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertTitle>
                {createMutation.error instanceof ApiError && createMutation.error.code === 'QUOTA_EXCEEDED'
                  ? '알림 한도 초과'
                  : '오류'}
              </AlertTitle>
              <AlertDescription>
                <p>{getUserMessage(createMutation.error)}</p>
                {createMutation.error instanceof ApiError && createMutation.error.code === 'QUOTA_EXCEEDED' && (
                  <Button asChild variant='outline' size='sm' className='mt-3'>
                    <Link href='/pricing'>플랜 업그레이드</Link>
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            onChange={() => {
              createMutation.reset();
              setFieldErrors({});
            }}
            className='space-y-6'
            data-testid='create-alert-form'
          >
            {/* 호텔 검색 */}
            <div className='space-y-2'>
              <Label>호텔 *</Label>
              <HotelSearchInput
                onSelect={setSelectedHotel}
                selectedHotel={selectedHotel}
                onClear={() => setSelectedHotel(null)}
                error={fieldErrors.platformId}
              />
            </div>

            {/* 날짜 선택 */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='checkIn'>체크인 *</Label>
                <Input
                  type='date'
                  id='checkIn'
                  name='checkIn'
                  required
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className='bg-background/80 transition-all focus:bg-background'
                  data-testid='checkin-input'
                />
                {fieldErrors.checkIn && <p className='text-xs text-destructive'>{fieldErrors.checkIn}</p>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='checkOut'>체크아웃 *</Label>
                <Input
                  type='date'
                  id='checkOut'
                  name='checkOut'
                  required
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className='bg-background/80 transition-all focus:bg-background'
                  data-testid='checkout-input'
                />
                {fieldErrors.checkOut && <p className='text-xs text-destructive'>{fieldErrors.checkOut}</p>}
              </div>
            </div>

            {/* 인원/객실 */}
            <div className='grid grid-cols-3 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='adults'>성인</Label>
                <Input
                  type='number'
                  id='adults'
                  name='adults'
                  min='1'
                  max='20'
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value, 10) || 1)}
                  className='bg-background/80 transition-all focus:bg-background'
                />
                {fieldErrors.adults && <p className='text-xs text-destructive'>{fieldErrors.adults}</p>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='children'>아동</Label>
                <Input
                  type='number'
                  id='children'
                  name='children'
                  min='0'
                  max='10'
                  value={children}
                  onChange={(e) => setChildren(parseInt(e.target.value, 10) || 0)}
                  className='bg-background/80 transition-all focus:bg-background'
                />
                {fieldErrors.children && <p className='text-xs text-destructive'>{fieldErrors.children}</p>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='rooms'>객실 수</Label>
                <Input
                  type='number'
                  id='rooms'
                  name='rooms'
                  min='1'
                  max='10'
                  value={rooms}
                  onChange={(e) => setRooms(parseInt(e.target.value, 10) || 1)}
                  className='bg-background/80 transition-all focus:bg-background'
                />
                {fieldErrors.rooms && <p className='text-xs text-destructive'>{fieldErrors.rooms}</p>}
              </div>
            </div>

            {/* 동의 체크박스 */}
            <div className='rounded-lg border border-border p-4'>
              <div className='flex items-start gap-3'>
                <Checkbox
                  id='consentOptIn'
                  checked={consentOptIn}
                  onCheckedChange={(checked) => setConsentOptIn(checked === true)}
                  className='mt-0.5'
                  data-testid='consent-optin-checkbox'
                />
                <div className='space-y-1'>
                  <Label htmlFor='consentOptIn' className='cursor-pointer font-medium'>
                    알림 수신 동의 *
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    빈방 발생 및 가격 하락 시 이메일 알림 수신에 동의합니다. 언제든지 수신거부가 가능합니다.
                  </p>
                </div>
              </div>
              {fieldErrors.consentOptIn && <p className='mt-2 text-xs text-destructive'>{fieldErrors.consentOptIn}</p>}
            </div>

            {/* 버튼 */}
            <div className='flex gap-4'>
              <Button
                type='submit'
                disabled={createMutation.isPending}
                className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'
                data-testid='create-alert-submit-button'
              >
                {createMutation.isPending ? '등록 중...' : '알림 등록'}
              </Button>
              <Button asChild variant='outline' className='border-border'>
                <Link href='/dashboard'>취소</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
