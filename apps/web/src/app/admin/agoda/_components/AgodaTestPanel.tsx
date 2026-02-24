'use client';

import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Hotel, Loader2, MapPin, Search } from 'lucide-react';

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
// City Search Form
// ============================================================================

function CitySearchForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const [cityId, setCityId] = useState('9395');
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
          occupancy: {
            numberOfAdult: Number(adults),
            numberOfChildren: Number(children),
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
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-1.5'>
          <Label htmlFor='cityId'>City ID</Label>
          <Input id='cityId' value={cityId} onChange={(e) => setCityId(e.target.value)} placeholder='예: 9395 (서울)' />
        </div>
        <div className='space-y-1.5'>
          <Label>통화 / 언어</Label>
          <div className='flex gap-2'>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder='USD' className='w-24' />
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder='ko-kr' />
          </div>
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
                <SelectItem value='PriceAsc'>가격 낮은 순</SelectItem>
                <SelectItem value='PriceDesc'>가격 높은 순</SelectItem>
                <SelectItem value='StarRating'>별점 순</SelectItem>
                <SelectItem value='ReviewScore'>리뷰 점수 순</SelectItem>
                <SelectItem value='Popularity'>인기 순</SelectItem>
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

function HotelSearchForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const [hotelIds, setHotelIds] = useState('407854');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('ko-kr');
  const [adults, setAdults] = useState('2');
  const [children, setChildren] = useState('0');

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
          occupancy: {
            numberOfAdult: Number(adults),
            numberOfChildren: Number(children),
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
        <div className='space-y-1.5'>
          <Label htmlFor='checkIn2'>체크인</Label>
          <Input id='checkIn2' type='date' value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
        </div>
        <div className='space-y-1.5'>
          <Label htmlFor='checkOut2'>체크아웃</Label>
          <Input id='checkOut2' type='date' value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
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
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div className='min-w-0'>
            <p className='font-semibold'>{String(hotel.hotelName ?? '-')}</p>
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
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Panel
// ============================================================================

export function AgodaTestPanel() {
  return (
    <div className='mx-auto max-w-4xl space-y-6 px-4 py-8'>
      <div>
        <h1 className='text-2xl font-bold'>Agoda Affiliate API 테스트</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          Long Tail Search API v2.0 — City Search / Hotel List Search
        </p>
      </div>

      <Alert>
        <AlertCircle className='size-4' />
        <AlertTitle>환경 변수 필요</AlertTitle>
        <AlertDescription className='text-xs'>
          <code>.env.local</code>에 <code>AGODA_SITE_ID</code>와 <code>AGODA_API_KEY</code>를 설정해야 합니다.
          <br />
          Authorization 헤더 형식: <code>siteid:apikey</code>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue='city'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='city' className='gap-1.5'>
            <MapPin className='size-3.5' />
            City Search
          </TabsTrigger>
          <TabsTrigger value='hotel' className='gap-1.5'>
            <Hotel className='size-3.5' />
            Hotel List Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value='city'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>City Search</CardTitle>
              <CardDescription>도시 ID 기준으로 예약 가능한 숙소 목록을 검색합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <CitySearchForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='hotel'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Hotel List Search</CardTitle>
              <CardDescription>특정 호텔 ID 기준으로 가용 여부와 가격을 조회합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <HotelSearchForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
