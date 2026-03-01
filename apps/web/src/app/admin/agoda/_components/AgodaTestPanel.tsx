'use client';

import { useCallback, useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { AgodaHotelRow } from '@/services/admin/agoda-hotel.service';
import { AlertCircle, CheckCircle2, Database, Hotel, Loader2, MapPin, Search } from 'lucide-react';
import Image from 'next/image';

type ApiResult = {
  ok: boolean;
  status?: number;
  message?: string;
  error?: string;
  hint?: string;
  body?: unknown;
};

async function parseResponse(res: Response): Promise<ApiResult> {
  try {
    return (await res.json()) as ApiResult;
  } catch {
    return { ok: false, error: `HTTP ${res.status}`, body: await res.text() };
  }
}

// ============================================================================
// DB 호텔 검색 폼
// ============================================================================

function DbHotelCard({ hotel, selected, onToggle }: { hotel: AgodaHotelRow; selected: boolean; onToggle: () => void }) {
  return (
    <Card
      className={cn('cursor-pointer text-sm transition-colors hover:bg-muted/40', selected && 'ring-2 ring-primary')}
      onClick={onToggle}
    >
      <CardContent className='py-3'>
        <div className='flex items-start gap-3'>
          <Checkbox
            checked={selected}
            onCheckedChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            className='mt-0.5'
          />
          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='truncate font-medium'>{hotel.hotelName}</p>
                {hotel.hotelTranslatedName && (
                  <p className='truncate text-xs text-muted-foreground'>{hotel.hotelTranslatedName}</p>
                )}
                <p className='mt-0.5 text-xs text-muted-foreground'>
                  {[hotel.cityName, hotel.countryName].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className='flex shrink-0 flex-col items-end gap-1'>
                {hotel.starRating != null && (
                  <Badge variant='outline' className='text-xs'>
                    ★ {hotel.starRating}
                  </Badge>
                )}
                {hotel.ratingAverage != null && (
                  <span className='text-xs text-muted-foreground'>
                    {hotel.ratingAverage} ({hotel.reviewCount?.toLocaleString() ?? 0}개 리뷰)
                  </span>
                )}
              </div>
            </div>
            <p className='mt-1 text-xs text-muted-foreground/60'>Hotel ID: {hotel.hotelId}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type CountryOption = { countryCode: string; countryName: string | null };

function DbHotelSearchForm({
  onSelectForApi,
  onSelectionChange,
}: {
  onSelectForApi: (hotels: AgodaHotelRow[]) => void;
  onSelectionChange?: (hotels: AgodaHotelRow[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [countryCode, setCountryCode] = useState('all');
  const [limit, setLimit] = useState('20');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AgodaHotelRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/agoda/countries')
      .then((res) => res.json())
      .then((data: { ok?: boolean; countries?: CountryOption[] }) => {
        if (!cancelled && data.ok && Array.isArray(data.countries)) {
          setCountryOptions(data.countries);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 선택이 바뀔 때마다 상위에 알려 City Search / Hotel List Search에 반영
  useEffect(() => {
    if (!onSelectionChange) return;
    const hotels = results.filter((h) => selected.has(h.hotelId));
    onSelectionChange(hotels);
  }, [results, selected, onSelectionChange]);

  async function handleSearch(e: { preventDefault(): void }) {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setSelected(new Set());
    setSearchError(null);
    try {
      const params = new URLSearchParams({ q: query.trim(), limit });
      if (countryCode && countryCode !== 'all') params.set('countryCode', countryCode);
      const res = await fetch(`/api/admin/agoda/hotels?${params.toString()}`);
      const data = (await res.json()) as { ok: boolean; results?: AgodaHotelRow[]; error?: string; message?: string };
      if (!data.ok) {
        setSearchError(data.message ?? data.error ?? '검색 중 오류가 발생했습니다.');
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className='space-y-5'>
      <form onSubmit={handleSearch} className='flex gap-2'>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='호텔명 입력 (한국어 / 영어, 2자 이상)'
          className='flex-1'
        />
        <Select value={countryCode} onValueChange={setCountryCode}>
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='국가 선택' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>전체</SelectItem>
            {countryOptions.map((opt) => (
              <SelectItem key={opt.countryCode} value={opt.countryCode}>
                {opt.countryName ?? opt.countryCode} ({opt.countryCode})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className='w-20'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='10'>10개</SelectItem>
            <SelectItem value='20'>20개</SelectItem>
            <SelectItem value='50'>50개</SelectItem>
          </SelectContent>
        </Select>
        <Button type='submit' disabled={loading || query.trim().length < 2}>
          {loading ? <Loader2 className='size-4 animate-spin' /> : <Search className='size-4' />}
        </Button>
      </form>

      {searchError && (
        <Alert variant='destructive'>
          <AlertCircle className='size-4' />
          <AlertTitle>검색 오류</AlertTitle>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {searched && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              {results.length === 0 && !searchError ? '결과 없음' : `${results.length}개 결과`}
            </p>
            {results.length > 0 && (
              <div className='flex gap-2'>
                <Button variant='ghost' size='sm' onClick={() => setSelected(new Set(results.map((h) => h.hotelId)))}>
                  전체 선택
                </Button>
                <Button variant='ghost' size='sm' onClick={() => setSelected(new Set())}>
                  전체 해제
                </Button>
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>검색 결과가 없습니다.</p>
          ) : (
            <div className='grid gap-2'>
              {results.map((hotel) => (
                <DbHotelCard
                  key={hotel.hotelId}
                  hotel={hotel}
                  selected={selected.has(hotel.hotelId)}
                  onToggle={() => toggleSelect(hotel.hotelId)}
                />
              ))}
            </div>
          )}

          {selected.size > 0 && (
            <Button className='w-full' onClick={() => onSelectForApi(results.filter((h) => selected.has(h.hotelId)))}>
              <Hotel className='mr-2 size-4' />
              선택한 {selected.size}개 호텔 API 가격 조회 →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Date Preset Buttons
// ============================================================================

function DatePresetButtons({ onSelect }: { onSelect: (checkIn: string, checkOut: string) => void }) {
  function fmt(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
  function addDays(base: Date, days: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  }

  const today = new Date();
  const dow = today.getDay(); // 0=일, 6=토
  const daysToSat = dow === 6 ? 7 : 6 - dow;

  const presets = [
    { label: '내일~모레', ci: fmt(addDays(today, 1)), co: fmt(addDays(today, 2)) },
    { label: '이번 주말', ci: fmt(addDays(today, daysToSat)), co: fmt(addDays(today, daysToSat + 1)) },
    { label: '다음 주말', ci: fmt(addDays(today, daysToSat + 7)), co: fmt(addDays(today, daysToSat + 8)) },
    { label: '1주 후 1박', ci: fmt(addDays(today, 7)), co: fmt(addDays(today, 8)) },
  ];

  return (
    <div className='flex flex-wrap gap-1.5'>
      {presets.map((p) => (
        <Button
          key={p.label}
          type='button'
          variant='outline'
          size='sm'
          className='h-7 text-xs'
          onClick={() => onSelect(p.ci, p.co)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

// ============================================================================
// City Search Form
// ============================================================================

function CitySearchForm({ pendingCityId }: { pendingCityId: number | null }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const [cityId, setCityId] = useState('9395');

  useEffect(() => {
    if (pendingCityId != null) {
      setCityId(String(pendingCityId));
    }
  }, [pendingCityId]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('ko-kr');
  const [sortBy, setSortBy] = useState('PriceAsc');
  const [maxResult, setMaxResult] = useState('10');
  const [minStar, setMinStar] = useState('0');
  const [minReview, setMinReview] = useState('0');
  const [dailyMin, setDailyMin] = useState('1');
  const [dailyMax, setDailyMax] = useState('10000');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [childrenAges, setChildrenAges] = useState<string[]>([]);
  const [discountOnly, setDiscountOnly] = useState(false);

  useEffect(() => {
    const n = Math.max(0, Number(children) || 0);
    setChildrenAges((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? '5'));
  }, [children]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/agoda/city-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInDate: checkIn,
          checkOutDate: checkOut,
          cityId: Number(cityId),
          currency,
          language,
          sortBy,
          maxResult: Number(maxResult),
          minimumStarRating: Number(minStar),
          minimumReviewScore: Number(minReview),
          dailyRateMin: Number(dailyMin),
          dailyRateMax: Number(dailyMax),
          discountOnly,
          occupancy: {
            numberOfAdult: Number(adults),
            numberOfChildren: Number(children),
            ...(childrenAges.length > 0 ? { childrenAges: childrenAges.map(Number) } : {}),
          },
        }),
      });
      setResult(await parseResponse(res));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {pendingCityId != null && (
        <Alert>
          <Database className='size-4' />
          <AlertTitle className='text-sm'>DB 검색에서 선택한 호텔의 도시</AlertTitle>
          <AlertDescription className='text-xs text-muted-foreground'>
            City ID가 자동 입력됐습니다. 날짜 입력 후 조회하세요.
          </AlertDescription>
        </Alert>
      )}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='cityId'>
            City ID
            <span className='ml-2 text-xs font-normal text-muted-foreground'>
              서울 9395 · 도쿄 9785 · 방콕 9307 · 오사카 8418
            </span>
          </Label>
          <Input id='cityId' value={cityId} onChange={(e) => setCityId(e.target.value)} placeholder='예: 9395' />
        </div>
        <div className='space-y-1.5'>
          <Label>통화 / 언어</Label>
          <div className='flex gap-2'>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder='USD' className='w-24' />
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder='ko-kr' />
          </div>
        </div>
        <div className='space-y-1.5 md:col-span-2'>
          <Label>날짜 빠른 선택</Label>
          <DatePresetButtons
            onSelect={(ci, co) => {
              setCheckIn(ci);
              setCheckOut(co);
            }}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='checkIn'>체크인</Label>
          <Input id='checkIn' type='date' value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='checkOut'>체크아웃</Label>
          <Input id='checkOut' type='date' value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
        </div>
        <div className='space-y-1.5'>
          <Label>정렬 / 최대 결과</Label>
          <div className='flex gap-2'>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className='flex-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Recommended'>추천 순</SelectItem>
                <SelectItem value='PriceAsc'>가격 낮은 순</SelectItem>
                <SelectItem value='PriceDesc'>가격 높은 순</SelectItem>
                <SelectItem value='StarRatingDesc'>별점 높은 순</SelectItem>
                <SelectItem value='StarRatingAsc'>별점 낮은 순</SelectItem>
                <SelectItem value='AllGuestsReviewScore'>전체 게스트 리뷰</SelectItem>
                <SelectItem value='BusinessTravellerReviewScore'>비즈니스 여행자</SelectItem>
                <SelectItem value='CouplesReviewScore'>커플</SelectItem>
                <SelectItem value='SoloTravellersReviewScore'>솔로 여행자</SelectItem>
                <SelectItem value='FamiliesWithYoungReviewScore'>어린 자녀 가족</SelectItem>
                <SelectItem value='FamiliesWithTeenReviewScore'>십대 자녀 가족</SelectItem>
                <SelectItem value='GroupsReviewScore'>그룹</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type='number'
              value={maxResult}
              onChange={(e) => setMaxResult(e.target.value)}
              min={1}
              max={30}
              className='w-20'
              placeholder='10'
            />
          </div>
        </div>
        <div className='space-y-1.5'>
          <Label>최소 별점 / 최소 리뷰점수</Label>
          <div className='flex gap-2'>
            <Input
              type='number'
              value={minStar}
              onChange={(e) => setMinStar(e.target.value)}
              min={0}
              max={5}
              placeholder='0'
            />
            <Input
              type='number'
              value={minReview}
              onChange={(e) => setMinReview(e.target.value)}
              min={0}
              max={10}
              step={0.1}
              placeholder='0'
            />
          </div>
        </div>
        <div className='space-y-1.5'>
          <Label>1박 가격 범위 (최소 / 최대)</Label>
          <div className='flex items-center gap-2'>
            <Input type='number' value={dailyMin} onChange={(e) => setDailyMin(e.target.value)} placeholder='1' />
            <span className='text-muted-foreground'>~</span>
            <Input type='number' value={dailyMax} onChange={(e) => setDailyMax(e.target.value)} placeholder='10000' />
          </div>
        </div>
        <div className='space-y-1.5'>
          <Label>인원 (성인 / 어린이)</Label>
          <div className='flex gap-2'>
            <Input type='number' value={adults} onChange={(e) => setAdults(e.target.value)} min={1} placeholder='2' />
            <Input
              type='number'
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              min={0}
              placeholder='0'
            />
          </div>
        </div>
        {childrenAges.length > 0 && (
          <div className='space-y-1.5 md:col-span-2'>
            <Label>어린이 나이 (0–17세)</Label>
            <div className='flex flex-wrap gap-2'>
              {childrenAges.map((age, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 인덱스가 어린이 순서를 의미함
                <div key={i} className='flex items-center gap-1'>
                  <span className='text-xs text-muted-foreground'>#{i + 1}</span>
                  <Input
                    type='number'
                    value={age}
                    onChange={(e) => {
                      const next = [...childrenAges];
                      next[i] = e.target.value;
                      setChildrenAges(next);
                    }}
                    min={0}
                    max={17}
                    className='w-16'
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className='flex items-center gap-2 md:col-span-2'>
          <Checkbox
            id='discountOnly'
            checked={discountOnly}
            onCheckedChange={(checked) => setDiscountOnly(checked === true)}
          />
          <Label htmlFor='discountOnly' className='cursor-pointer font-normal'>
            할인 상품만 표시 (discountOnly)
          </Label>
        </div>
      </div>

      <Button type='submit' disabled={loading} className='w-full'>
        {loading ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Search className='mr-2 size-4' />}
        City Search 실행
      </Button>

      <ResultDisplay result={result} />
    </form>
  );
}

// ============================================================================
// Hotel List Search Form
// ============================================================================

function HotelSearchForm({ pendingHotelIds }: { pendingHotelIds: number[] | null }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const [hotelIds, setHotelIds] = useState('407854');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('ko-kr');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');
  const [childrenAges, setChildrenAges] = useState<string[]>([]);
  const [discountOnly, setDiscountOnly] = useState(false);

  useEffect(() => {
    if (pendingHotelIds && pendingHotelIds.length > 0) {
      setHotelIds(pendingHotelIds.join(', '));
    }
  }, [pendingHotelIds]);

  useEffect(() => {
    const n = Math.max(0, Number(children) || 0);
    setChildrenAges((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? '5'));
  }, [children]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const ids = hotelIds
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);

    try {
      const res = await fetch('/api/admin/agoda/hotel-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInDate: checkIn,
          checkOutDate: checkOut,
          hotelIds: ids,
          currency,
          language,
          discountOnly,
          occupancy: {
            numberOfAdult: Number(adults),
            numberOfChildren: Number(children),
            ...(childrenAges.length > 0 ? { childrenAges: childrenAges.map(Number) } : {}),
          },
        }),
      });
      setResult(await parseResponse(res));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {pendingHotelIds && pendingHotelIds.length > 0 && (
        <Alert>
          <Database className='size-4' />
          <AlertTitle className='text-sm'>DB 검색에서 {pendingHotelIds.length}개 호텔 선택됨</AlertTitle>
          <AlertDescription className='text-xs text-muted-foreground'>
            Hotel ID가 자동 입력됐습니다. 날짜를 입력 후 조회하세요.
          </AlertDescription>
        </Alert>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-1.5 md:col-span-2'>
          <Label htmlFor='hotelIds'>Hotel ID 목록 (쉼표 구분)</Label>
          <Input
            id='hotelIds'
            value={hotelIds}
            onChange={(e) => setHotelIds(e.target.value)}
            placeholder='예: 407854, 463019'
          />
        </div>
        <div className='space-y-1.5'>
          <Label>통화 / 언어</Label>
          <div className='flex gap-2'>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder='USD' className='w-24' />
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder='ko-kr' />
          </div>
        </div>
        <div className='space-y-1.5'>
          <Label>인원 (성인 / 어린이)</Label>
          <div className='flex gap-2'>
            <Input type='number' value={adults} onChange={(e) => setAdults(e.target.value)} min={1} placeholder='2' />
            <Input
              type='number'
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              min={0}
              placeholder='0'
            />
          </div>
        </div>
        <div className='space-y-1.5 md:col-span-2'>
          <Label>날짜 빠른 선택</Label>
          <DatePresetButtons
            onSelect={(ci, co) => {
              setCheckIn(ci);
              setCheckOut(co);
            }}
          />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='checkIn2'>체크인</Label>
          <Input id='checkIn2' type='date' value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='checkOut2'>체크아웃</Label>
          <Input id='checkOut2' type='date' value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
        </div>
        {childrenAges.length > 0 && (
          <div className='space-y-1.5 md:col-span-2'>
            <Label>어린이 나이 (0–17세)</Label>
            <div className='flex flex-wrap gap-2'>
              {childrenAges.map((age, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: 인덱스가 어린이 순서를 의미함
                <div key={i} className='flex items-center gap-1'>
                  <span className='text-xs text-muted-foreground'>#{i + 1}</span>
                  <Input
                    type='number'
                    value={age}
                    onChange={(e) => {
                      const next = [...childrenAges];
                      next[i] = e.target.value;
                      setChildrenAges(next);
                    }}
                    min={0}
                    max={17}
                    className='w-16'
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className='flex items-center gap-2 md:col-span-2'>
          <Checkbox
            id='discountOnly2'
            checked={discountOnly}
            onCheckedChange={(checked) => setDiscountOnly(checked === true)}
          />
          <Label htmlFor='discountOnly2' className='cursor-pointer font-normal'>
            할인 상품만 표시 (discountOnly)
          </Label>
        </div>
      </div>

      <Button type='submit' disabled={loading} className='w-full'>
        {loading ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Hotel className='mr-2 size-4' />}
        Hotel List Search 실행
      </Button>

      <ResultDisplay result={result} />
    </form>
  );
}

// ============================================================================
// Result Display
// ============================================================================

function ResultDisplay({ result }: { result: ApiResult | null }) {
  if (!result) return null;

  const hotelResults = (() => {
    if (!result.ok || !result.body) return null;
    const b = result.body as { results?: unknown[] };
    return Array.isArray(b.results) ? b.results : null;
  })();

  return (
    <div className='space-y-4'>
      <Alert variant={result.ok ? 'default' : 'destructive'}>
        {result.ok ? <CheckCircle2 className='size-4' /> : <AlertCircle className='size-4' />}
        <AlertTitle className='flex items-center gap-2'>
          {result.ok ? '성공' : '오류'}
          {result.status && (
            <Badge variant={result.ok ? 'secondary' : 'destructive'} className='text-xs'>
              HTTP {result.status}
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription>
          {result.message ?? result.error ?? (result.ok ? '요청 완료' : '요청 실패')}
          {result.hint && <p className='mt-1 text-xs opacity-80'>{result.hint}</p>}
        </AlertDescription>
      </Alert>

      {hotelResults && hotelResults.length > 0 && (
        <div className='space-y-2'>
          <p className='text-sm font-medium text-muted-foreground'>숙소 목록 ({hotelResults.length}개)</p>
          <div className='grid gap-3'>
            {hotelResults.map((hotel) => {
              const h = hotel as Record<string, unknown>;
              return <HotelCard key={String(h.hotelId ?? JSON.stringify(h))} hotel={h} />;
            })}
          </div>
        </div>
      )}

      <div className='space-y-1'>
        <p className='text-xs font-medium text-muted-foreground'>Raw Response</p>
        <pre className='max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs'>
          {JSON.stringify(result.body, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Record<string, unknown> }) {
  return (
    <Card className='text-sm'>
      <CardContent className='pt-4 pb-3'>
        <div className='flex gap-3'>
          {hotel.imageURL != null && (
            <div className='relative h-16 w-24 shrink-0 overflow-hidden rounded'>
              <Image
                src={String(hotel.imageURL)}
                alt={String(hotel.hotelName ?? '')}
                fill
                className='object-cover'
                unoptimized
              />
            </div>
          )}
          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='font-semibold'>{String(hotel.hotelName ?? '-')}</p>
                {hotel.roomtypeName != null && (
                  <p className='text-xs text-muted-foreground'>{String(hotel.roomtypeName)}</p>
                )}
                <p className='text-muted-foreground text-xs'>ID: {String(hotel.hotelId ?? '-')}</p>
              </div>
              <div className='flex flex-col items-end gap-1'>
                <Badge variant='outline'>
                  {'★'.repeat(Number(hotel.starRating ?? 0))} {String(hotel.starRating ?? 0)}성
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  리뷰 {String(hotel.reviewScore ?? '-')} ({String(hotel.reviewCount ?? 0)}개)
                </span>
              </div>
            </div>
            <div className='mt-2 flex flex-wrap gap-3 text-xs'>
              <span className='font-medium text-primary'>
                {String(hotel.currency ?? 'USD')} {String(hotel.dailyRate ?? '-')} / 박
              </span>
              {hotel.crossedOutRate != null && (
                <span className='line-through text-muted-foreground'>
                  {String(hotel.currency ?? '')} {String(hotel.crossedOutRate)}
                </span>
              )}
              {hotel.discountPercentage != null && hotel.discountPercentage !== 0 ? (
                <Badge variant='destructive' className='text-xs'>
                  -{String(hotel.discountPercentage)}%
                </Badge>
              ) : null}
              {hotel.includeBreakfast === true ? <Badge variant='secondary'>조식 포함</Badge> : null}
              {hotel.freeWifi === true ? <Badge variant='secondary'>무료 WiFi</Badge> : null}
            </div>
            {hotel.landingURL != null && (
              <a
                href={String(hotel.landingURL)}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-2 inline-block text-xs text-primary hover:underline'
              >
                Agoda에서 보기 →
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Panel
// ============================================================================

export function AgodaTestPanel() {
  const [activeTab, setActiveTab] = useState('db-search');
  const [pendingHotelIds, setPendingHotelIds] = useState<number[] | null>(null);
  const [pendingCityId, setPendingCityId] = useState<number | null>(null);

  const handleSelectionChange = useCallback((hotels: AgodaHotelRow[]) => {
    if (hotels.length === 0) {
      setPendingHotelIds(null);
      setPendingCityId(null);
    } else {
      setPendingHotelIds(hotels.map((h) => h.hotelId));
      setPendingCityId(hotels[0]?.cityId ?? null);
    }
  }, []);

  function handleSelectForApi(hotels: AgodaHotelRow[]) {
    if (hotels.length === 0) return;
    setPendingHotelIds(hotels.map((h) => h.hotelId));
    setPendingCityId(hotels[0]?.cityId ?? null);
    setActiveTab('hotel');
  }

  return (
    <div className='mx-auto max-w-4xl space-y-6 px-4 py-8'>
      <div>
        <h1 className='text-2xl font-bold'>Agoda Affiliate API 테스트</h1>
        <p className='mt-1 text-sm text-muted-foreground'>DB 호텔 검색 → Hotel List Search API · City Search API</p>
      </div>

      <Alert>
        <AlertCircle className='size-4' />
        <AlertTitle>환경 변수 필요</AlertTitle>
        <AlertDescription className='text-xs'>
          <code>.env.local</code>에 <code>AGODA_AFFILIATE_SITE_ID</code>와 <code>AGODA_AFFILIATE_API_KEY</code>를
          설정해야 City Search / Hotel List Search API가 동작합니다.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='db-search' className='gap-1.5'>
            <Database className='size-3.5' />
            DB 호텔 검색
          </TabsTrigger>
          <TabsTrigger value='city' className='gap-1.5'>
            <MapPin className='size-3.5' />
            City Search
          </TabsTrigger>
          <TabsTrigger value='hotel' className='gap-1.5'>
            <Hotel className='size-3.5' />
            Hotel List Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value='db-search' forceMount className='data-[state=inactive]:hidden'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>DB 호텔 검색</CardTitle>
              <CardDescription>
                3백만 개 호텔 데이터베이스에서 이름으로 검색합니다. 원하는 호텔을 선택 후 API 가격을 조회하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DbHotelSearchForm onSelectForApi={handleSelectForApi} onSelectionChange={handleSelectionChange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='city' forceMount className='data-[state=inactive]:hidden'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>City Search</CardTitle>
              <CardDescription>도시 ID 기준으로 예약 가능한 숙소 목록을 검색합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <CitySearchForm pendingCityId={pendingCityId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='hotel' forceMount className='data-[state=inactive]:hidden'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Hotel List Search</CardTitle>
              <CardDescription>특정 호텔 ID 기준으로 가용 여부와 가격을 조회합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <HotelSearchForm pendingHotelIds={pendingHotelIds} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
