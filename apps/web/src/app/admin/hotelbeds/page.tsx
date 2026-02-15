'use client';

import { useMemo, useState } from 'react';

import { AlertCircle, Beaker, CheckCircle2, Loader2, MapPin, Search, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface HotelbedsTestResponse {
  success: boolean;
  durationMs: number;
  request?: {
    hotelCode: string;
    url: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    rooms: number;
  };
  result?: {
    available: boolean;
    price: string | null;
    reason: string | null;
    metadata?: Record<string, unknown> | null;
  };
  raw?: Record<string, unknown>;
  error?: string;
  details?: unknown;
}

type SearchMode = 'destination' | 'geolocation';

interface HotelbedsSearchResponse {
  success: boolean;
  durationMs?: number;
  count?: number;
  hotels?: Array<{
    code: string | number | null;
    name: string | null;
    destinationCode: string | null;
    destinationName: string | null;
    minRate: number | string | null;
    currency: string | null;
    roomCount: number;
  }>;
  error?: string;
  body?: string;
}

interface PlaceCandidate {
  id: string;
  displayName: string;
  formattedAddress: string | null;
  shortFormattedAddress: string | null;
  postalCode: string | null;
  internationalPhoneNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUri: string | null;
  websiteUri: string | null;
}

interface PlaceCandidatesResponse {
  success: boolean;
  query?: string;
  count?: number;
  candidates?: PlaceCandidate[];
  error?: string;
  body?: string;
}

interface HotelbedsMatchedCandidate {
  score: number;
  distanceScore: number;
  nameScore: number;
  regionScore: number;
  addressScore: number;
  distanceKm: number | null;
  hasCoordinates: boolean;
  postalMatch: boolean;
  phoneMatch: boolean;
  webDomainMatch: boolean;
  decision: 'CONFIRMED' | 'REVIEW' | 'UNMATCHED';
  confidence: 'high' | 'medium' | 'low';
  decisionReasons: string[];
  hotel: {
    code: string | number | null;
    name: string | null;
    destinationCode: string | null;
    destinationName: string | null;
    zoneCode: string | number | null;
    zoneName: string | null;
    categoryCode: string | null;
    categoryName: string | null;
    latitude: number | null;
    longitude: number | null;
    minRate: number | string | null;
    maxRate: number | string | null;
    currency: string | null;
    roomCount: number;
    postalCode: string | null;
    address: string | null;
    phones: string[];
    websiteDomain: string | null;
  };
}

interface HotelbedsMatchResponse {
  success: boolean;
  durationMs?: number;
  totalHotels?: number;
  usedHotels?: number;
  strictFilteredCount?: number;
  filteredCount?: number;
  noCoordinateCount?: number;
  contentDetailsFetched?: number;
  filterMode?: 'strict' | 'relaxed' | 'score-fallback' | 'distance-fallback' | 'no-coordinate-fallback';
  decisionSummary?: {
    confirmed: number;
    review: number;
    unmatched: number;
  };
  thresholds?: {
    radiusKm?: number;
    maxDistanceKm?: number;
    minScore?: number;
    weights?: {
      distance?: number;
      name?: number;
      region?: number;
      address?: number;
      postal?: number;
      phone?: number;
      web?: number;
    };
  };
  matches?: HotelbedsMatchedCandidate[];
  error?: string;
  body?: string;
}

function dateAt(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

function buildPreviewUrl(hotelCode: string, checkIn: string, checkOut: string, adults: number): string {
  if (!hotelCode) return '';
  const params = new URLSearchParams({
    hotelCode,
    checkIn,
    checkOut,
    adults: String(adults),
  });
  return `https://api.test.hotelbeds.com/hotel-api/1.0/hotels?${params.toString()}`;
}

export default function HotelbedsLabPage(): React.ReactElement {
  const [placeInput, setPlaceInput] = useState('');
  const [placeLoading, setPlaceLoading] = useState(false);
  const [placeResult, setPlaceResult] = useState<PlaceCandidatesResponse | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(null);

  const [hotelCode, setHotelCode] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('destination');
  const [destinationCode, setDestinationCode] = useState('');
  const [latitude, setLatitude] = useState('41.390205');
  const [longitude, setLongitude] = useState('2.154007');
  const [radius, setRadius] = useState('20');
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<HotelbedsSearchResponse | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<HotelbedsMatchResponse | null>(null);
  const [matchRadiusKm, setMatchRadiusKm] = useState('3');
  const [matchMinScore, setMatchMinScore] = useState('0.55');

  const [checkIn, setCheckIn] = useState((): string => dateAt(7));
  const [checkOut, setCheckOut] = useState((): string => dateAt(8));
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<HotelbedsTestResponse | null>(null);

  const requestPreviewUrl = useMemo(
    (): string => buildPreviewUrl(hotelCode.trim(), checkIn, checkOut, adults),
    [hotelCode, checkIn, checkOut, adults],
  );

  const canSubmit = checkIn.length > 0 && checkOut.length > 0 && checkIn < checkOut && hotelCode.trim().length > 0;
  const canSearch =
    checkIn.length > 0 &&
    checkOut.length > 0 &&
    checkIn < checkOut &&
    (searchMode === 'destination'
      ? destinationCode.trim().length > 0
      : latitude.trim().length > 0 && longitude.trim().length > 0);
  const canSearchPlace = placeInput.trim().length > 0;
  const canMatch = selectedPlace?.latitude !== null && selectedPlace?.longitude !== null;

  const runPlaceSearch = async (): Promise<void> => {
    if (!canSearchPlace || placeLoading) return;

    setPlaceLoading(true);
    try {
      const res = await fetch('/api/admin/hotelbeds/place-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: placeInput.trim(),
          limit: 5,
        }),
      });

      const data = (await res.json()) as PlaceCandidatesResponse;
      setPlaceResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setPlaceResult({
        success: false,
        error: message,
      });
    } finally {
      setPlaceLoading(false);
    }
  };

  const selectPlaceCandidate = (candidate: PlaceCandidate): void => {
    setSelectedPlace(candidate);
    setMatchResult(null);

    if (candidate.latitude !== null && candidate.longitude !== null) {
      setSearchMode('geolocation');
      setLatitude(String(candidate.latitude));
      setLongitude(String(candidate.longitude));
    }
  };

  const runHotelSearch = async (): Promise<void> => {
    if (!canSearch || searchLoading) return;

    setSearchLoading(true);
    try {
      const payload: Record<string, unknown> = {
        mode: searchMode,
        checkIn,
        checkOut,
        adults,
        rooms,
        limit: 20,
      };

      if (searchMode === 'destination') {
        payload.destinationCode = destinationCode.trim();
      } else {
        payload.latitude = Number(latitude);
        payload.longitude = Number(longitude);
        payload.radius = Number(radius || '20');
        payload.unit = unit;
      }

      const res = await fetch('/api/admin/hotelbeds/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as HotelbedsSearchResponse;
      setSearchResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setSearchResult({ success: false, error: message });
    } finally {
      setSearchLoading(false);
    }
  };

  const runHotelbedsMatch = async (): Promise<void> => {
    if (!selectedPlace || selectedPlace.latitude === null || selectedPlace.longitude === null || matchLoading) return;

    setMatchLoading(true);
    try {
      const parsedRadius = Number(matchRadiusKm);
      const parsedMinScore = Number(matchMinScore);

      const res = await fetch('/api/admin/hotelbeds/match-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: selectedPlace.displayName,
          placeAddress: selectedPlace.formattedAddress ?? undefined,
          placePostalCode: selectedPlace.postalCode ?? undefined,
          placeInternationalPhone: selectedPlace.internationalPhoneNumber ?? undefined,
          placeWebsiteUri: selectedPlace.websiteUri ?? undefined,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          checkIn,
          checkOut,
          adults,
          rooms,
          radiusKm: Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 3,
          maxHotelCandidates: 60,
          topN: 2,
          minScore: Number.isFinite(parsedMinScore) ? parsedMinScore : 0.55,
        }),
      });

      const data = (await res.json()) as HotelbedsMatchResponse;
      setMatchResult(data);

      const primary = data.matches?.[0];
      const primaryCode = primary?.hotel.code;
      if (
        data.success &&
        primary &&
        primary.decision !== 'UNMATCHED' &&
        primaryCode !== null &&
        primaryCode !== undefined
      ) {
        setHotelCode(String(primaryCode));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setMatchResult({
        success: false,
        error: message,
      });
    } finally {
      setMatchLoading(false);
    }
  };

  const runTest = async (): Promise<void> => {
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/hotelbeds/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelCode: hotelCode.trim(),
          checkIn,
          checkOut,
          adults,
          rooms,
        }),
      });

      const data = (await res.json()) as HotelbedsTestResponse;
      setResponse(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setResponse({
        success: false,
        durationMs: 0,
        error: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className='mx-auto max-w-7xl space-y-6 px-4 py-8'>
      <div className='space-y-2'>
        <h1 className='flex items-center gap-2 text-3xl font-bold'>
          <Beaker className='size-7 text-primary' />
          Hotelbeds Lab
        </h1>
        <p className='text-base text-muted-foreground'>
          기존 숙소 등록 화면과 분리된 전용 테스트 화면입니다. `hotelCode` 기반 등록/검증 흐름을 먼저 안정화하세요.
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>입력 → 후보 리스트 → 선택 → 확정 호텔</CardTitle>
          <CardDescription>
            호텔명 또는 URL을 입력하면 Google Places 후보(최대 5개)를 보여줍니다. 하나를 선택하면 확정 호텔 카드가
            채워집니다.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='place-input'>호텔명 또는 URL</Label>
            <div className='flex gap-2'>
              <Input
                id='place-input'
                value={placeInput}
                onChange={(e): void => setPlaceInput(e.target.value)}
                placeholder='예: Jungfrau Lodge 또는 Agoda/Booking URL'
              />
              <Button type='button' onClick={runPlaceSearch} disabled={!canSearchPlace || placeLoading}>
                {placeLoading ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Search className='mr-2 size-4' />}
                {placeLoading ? '검색 중...' : '후보 검색'}
              </Button>
            </div>
          </div>

          {placeResult && (
            <div className='space-y-3'>
              <div className='flex flex-wrap items-center gap-2 text-sm'>
                <Badge variant={placeResult.success ? 'default' : 'destructive'}>
                  {placeResult.success ? 'Success' : 'Failed'}
                </Badge>
                {typeof placeResult.count === 'number' && (
                  <Badge variant='outline'>{placeResult.count} candidates</Badge>
                )}
                {placeResult.query && <Badge variant='outline'>query: {placeResult.query}</Badge>}
              </div>

              {placeResult.error && (
                <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>{placeResult.error}</div>
              )}
              {placeResult.body && (
                <pre className='max-h-48 overflow-auto rounded-md border bg-muted p-3 text-xs'>{placeResult.body}</pre>
              )}

              {placeResult.candidates && placeResult.candidates.length > 0 && (
                <div className='space-y-2'>
                  {placeResult.candidates.slice(0, 5).map((candidate) => (
                    <div key={candidate.id} className='flex items-start justify-between rounded-md border p-3'>
                      <div className='space-y-1'>
                        <p className='font-medium'>{candidate.displayName}</p>
                        <p className='text-xs text-muted-foreground'>id: {candidate.id}</p>
                        <p className='text-xs text-muted-foreground'>{candidate.formattedAddress ?? '-'}</p>
                        {candidate.postalCode && (
                          <p className='text-xs text-muted-foreground'>postal: {candidate.postalCode}</p>
                        )}
                        {candidate.internationalPhoneNumber && (
                          <p className='text-xs text-muted-foreground'>phone: {candidate.internationalPhoneNumber}</p>
                        )}
                        <p className='text-xs text-muted-foreground'>
                          {candidate.latitude !== null && candidate.longitude !== null
                            ? `${candidate.latitude}, ${candidate.longitude}`
                            : '좌표 없음'}
                        </p>
                        <div className='flex flex-wrap gap-2 text-xs'>
                          {candidate.googleMapsUri && (
                            <a
                              href={candidate.googleMapsUri}
                              target='_blank'
                              rel='noreferrer'
                              className='underline text-primary'
                            >
                              Google Maps
                            </a>
                          )}
                          {candidate.websiteUri && (
                            <a
                              href={candidate.websiteUri}
                              target='_blank'
                              rel='noreferrer'
                              className='underline text-primary'
                            >
                              Website
                            </a>
                          )}
                        </div>
                      </div>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={(): void => selectPlaceCandidate(candidate)}
                      >
                        선택
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedPlace && (
            <div className='rounded-md border bg-muted/30 p-4'>
              <p className='text-sm font-semibold'>확정 호텔</p>
              <p className='mt-1 text-sm'>{selectedPlace.displayName}</p>
              <p className='text-xs text-muted-foreground'>{selectedPlace.formattedAddress ?? '-'}</p>
              {selectedPlace.postalCode && (
                <p className='text-xs text-muted-foreground'>postal: {selectedPlace.postalCode}</p>
              )}
              {selectedPlace.internationalPhoneNumber && (
                <p className='text-xs text-muted-foreground'>phone: {selectedPlace.internationalPhoneNumber}</p>
              )}
              <p className='text-xs text-muted-foreground'>id: {selectedPlace.id}</p>
              <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                {selectedPlace.googleMapsUri && (
                  <a
                    href={selectedPlace.googleMapsUri}
                    target='_blank'
                    rel='noreferrer'
                    className='underline text-primary'
                  >
                    Google Maps
                  </a>
                )}
                {selectedPlace.websiteUri && (
                  <a
                    href={selectedPlace.websiteUri}
                    target='_blank'
                    rel='noreferrer'
                    className='underline text-primary'
                  >
                    Website
                  </a>
                )}
              </div>
              <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                <Badge variant='outline'>placeId: {selectedPlace.id}</Badge>
                {selectedPlace.latitude !== null && selectedPlace.longitude !== null && (
                  <Badge variant='outline'>
                    lat/lng: {selectedPlace.latitude}, {selectedPlace.longitude}
                  </Badge>
                )}
              </div>

              <div className='mt-4 space-y-3'>
                <div className='grid grid-cols-1 gap-3 rounded-md border bg-background/60 p-3 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <Label htmlFor='match-radius-km' className='text-xs'>
                      매칭 반경(km)
                    </Label>
                    <Input
                      id='match-radius-km'
                      type='number'
                      min={1}
                      max={100}
                      step='1'
                      value={matchRadiusKm}
                      onChange={(e): void => setMatchRadiusKm(e.target.value)}
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label htmlFor='match-min-score' className='text-xs'>
                      최소 점수(minScore)
                    </Label>
                    <Input
                      id='match-min-score'
                      type='number'
                      min={0}
                      max={1}
                      step='0.01'
                      value={matchMinScore}
                      onChange={(e): void => setMatchMinScore(e.target.value)}
                    />
                  </div>
                </div>

                <p className='text-xs text-muted-foreground'>
                  결과는 최대 2개만 반환됩니다. 1순위는 자동 채택되고, 2순위는 검토용으로 표시됩니다.
                </p>

                <Button type='button' onClick={runHotelbedsMatch} disabled={!canMatch || matchLoading}>
                  {matchLoading ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Search className='mr-2 size-4' />}
                  {matchLoading ? 'Hotelbeds 매칭 중...' : 'Hotelbeds 코드 매칭'}
                </Button>

                {!canMatch && (
                  <p className='text-xs text-muted-foreground'>
                    선택된 장소에 좌표가 없어 매칭할 수 없습니다. 다른 후보를 선택하세요.
                  </p>
                )}

                {matchResult && (
                  <div className='space-y-3 rounded-md border bg-background/60 p-3'>
                    <div className='flex flex-wrap items-center gap-2 text-sm'>
                      <Badge variant={matchResult.success ? 'default' : 'destructive'}>
                        {matchResult.success ? 'Match Success' : 'Match Failed'}
                      </Badge>
                      {typeof matchResult.durationMs === 'number' && (
                        <Badge variant='outline'>{matchResult.durationMs}ms</Badge>
                      )}
                      {typeof matchResult.totalHotels === 'number' && (
                        <Badge variant='outline'>total: {matchResult.totalHotels}</Badge>
                      )}
                      {typeof matchResult.usedHotels === 'number' && (
                        <Badge variant='outline'>used: {matchResult.usedHotels}</Badge>
                      )}
                      {typeof matchResult.filteredCount === 'number' && (
                        <Badge variant='outline'>filtered: {matchResult.filteredCount}</Badge>
                      )}
                      {typeof matchResult.strictFilteredCount === 'number' && (
                        <Badge variant='outline'>strict: {matchResult.strictFilteredCount}</Badge>
                      )}
                      {typeof matchResult.noCoordinateCount === 'number' && (
                        <Badge variant='outline'>no-coord: {matchResult.noCoordinateCount}</Badge>
                      )}
                      {typeof matchResult.contentDetailsFetched === 'number' && (
                        <Badge variant='outline'>details: {matchResult.contentDetailsFetched}</Badge>
                      )}
                      {matchResult.filterMode === 'relaxed' && <Badge variant='secondary'>relaxed fallback</Badge>}
                      {matchResult.filterMode === 'score-fallback' && <Badge variant='secondary'>score fallback</Badge>}
                      {matchResult.filterMode === 'distance-fallback' && (
                        <Badge variant='secondary'>distance fallback</Badge>
                      )}
                      {matchResult.filterMode === 'no-coordinate-fallback' && (
                        <Badge variant='secondary'>no-coordinate fallback</Badge>
                      )}
                    </div>
                    {matchResult.thresholds && (
                      <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                        {typeof matchResult.thresholds.maxDistanceKm === 'number' && (
                          <Badge variant='outline'>maxDist {matchResult.thresholds.maxDistanceKm}km</Badge>
                        )}
                        {typeof matchResult.thresholds.minScore === 'number' && (
                          <Badge variant='outline'>minScore {matchResult.thresholds.minScore}</Badge>
                        )}
                        {matchResult.thresholds.weights && (
                          <Badge variant='outline'>
                            w d:{matchResult.thresholds.weights.distance ?? 0} / n:
                            {matchResult.thresholds.weights.name ?? 0} / r:{matchResult.thresholds.weights.region ?? 0}{' '}
                            / a:
                            {matchResult.thresholds.weights.address ?? 0} / p:
                            {matchResult.thresholds.weights.postal ?? 0} / ph:
                            {matchResult.thresholds.weights.phone ?? 0} / w:{matchResult.thresholds.weights.web ?? 0}
                          </Badge>
                        )}
                      </div>
                    )}

                    {matchResult.decisionSummary && (
                      <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                        <Badge variant='outline'>confirmed {matchResult.decisionSummary.confirmed}</Badge>
                        <Badge variant='outline'>review {matchResult.decisionSummary.review}</Badge>
                        <Badge variant='outline'>unmatched {matchResult.decisionSummary.unmatched}</Badge>
                      </div>
                    )}

                    {matchResult.success &&
                      matchResult.matches &&
                      matchResult.matches.length > 0 &&
                      (matchResult.matches[0].decision !== 'UNMATCHED' ? (
                        <div className='rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700'>
                          1순위 코드 {String(matchResult.matches[0].hotel.code ?? '-')} 를 자동 채택했습니다.
                        </div>
                      ) : (
                        <div className='rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700'>
                          1순위가 `UNMATCHED`라 자동 채택하지 않았습니다. 2순위를 검토하세요.
                        </div>
                      ))}

                    {matchResult.filterMode === 'no-coordinate-fallback' && (
                      <div className='rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700'>
                        Hotelbeds 응답 호텔에 좌표가 부족해서 위치점수 계산이 어려웠습니다. 현재 결과는 좌표 없는
                        fallback 후보입니다.
                      </div>
                    )}

                    {matchResult.error && (
                      <div className='rounded-md bg-destructive/10 p-2 text-xs text-destructive'>
                        {matchResult.error}
                      </div>
                    )}
                    {matchResult.body && (
                      <pre className='max-h-40 overflow-auto rounded-md border bg-muted p-2 text-xs'>
                        {matchResult.body}
                      </pre>
                    )}

                    {matchResult.success && (!matchResult.matches || matchResult.matches.length === 0) && (
                      <div className='rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700'>
                        Hotelbeds 조회는 되었지만 현재 필터 조건에서 매칭 0건입니다. `매칭 반경`을 늘리거나 `최소
                        점수`를 낮춰 다시 시도하세요.
                      </div>
                    )}

                    {matchResult.matches && matchResult.matches.length > 0 && (
                      <div className='overflow-x-auto rounded-md border'>
                        <table className='min-w-full text-xs'>
                          <thead className='bg-muted/60 text-left'>
                            <tr>
                              <th className='px-2 py-2'>Score</th>
                              <th className='px-2 py-2'>Code</th>
                              <th className='px-2 py-2'>Hotel</th>
                              <th className='px-2 py-2'>Location</th>
                              <th className='px-2 py-2'>Rate</th>
                              <th className='px-2 py-2'>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchResult.matches.map((match, index) => (
                              <tr
                                key={`${match.hotel.code ?? 'unknown'}-${match.hotel.name ?? ''}-${match.score}-${index}`}
                                className='border-t align-top'
                              >
                                <td className='px-2 py-2'>
                                  <div className='font-medium'>
                                    #{index + 1} {match.score}
                                  </div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    {index === 0 ? '자동 채택' : '검토용'}
                                  </div>
                                  <div className='text-[11px]'>
                                    <Badge
                                      variant={
                                        match.decision === 'CONFIRMED'
                                          ? 'default'
                                          : match.decision === 'REVIEW'
                                            ? 'secondary'
                                            : 'destructive'
                                      }
                                    >
                                      {match.decision}
                                    </Badge>
                                    <span className='ml-2 text-muted-foreground'>{match.confidence}</span>
                                  </div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    dist {match.distanceScore}
                                    {match.distanceKm !== null ? ` (${match.distanceKm}km)` : ''}
                                  </div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    name {match.nameScore} / region {match.regionScore} / addr {match.addressScore}
                                  </div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    postal {match.postalMatch ? 'Y' : 'N'} / phone {match.phoneMatch ? 'Y' : 'N'} / web{' '}
                                    {match.webDomainMatch ? 'Y' : 'N'}
                                  </div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    reason: {match.decisionReasons.join(', ')}
                                  </div>
                                </td>
                                <td className='px-2 py-2 font-mono'>{match.hotel.code ?? '-'}</td>
                                <td className='px-2 py-2'>
                                  <div>{match.hotel.name ?? '-'}</div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    {match.hotel.categoryName ?? '-'}
                                    {match.hotel.categoryCode ? ` (${match.hotel.categoryCode})` : ''}
                                  </div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    zone: {match.hotel.zoneName ?? '-'}
                                    {match.hotel.zoneCode ? ` (${match.hotel.zoneCode})` : ''}
                                  </div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    postal: {match.hotel.postalCode ?? '-'}
                                  </div>
                                </td>
                                <td className='px-2 py-2'>
                                  <div>
                                    {match.hotel.destinationName ?? '-'}
                                    {match.hotel.destinationCode ? ` (${match.hotel.destinationCode})` : ''}
                                  </div>
                                  <div className='text-[11px] text-muted-foreground'>
                                    {match.hotel.latitude !== null && match.hotel.longitude !== null
                                      ? `${match.hotel.latitude}, ${match.hotel.longitude}`
                                      : '-'}
                                  </div>
                                </td>
                                <td className='px-2 py-2'>
                                  {match.hotel.currency && match.hotel.minRate !== null
                                    ? `${match.hotel.currency} ${match.hotel.minRate}`
                                    : '-'}
                                </td>
                                <td className='px-2 py-2'>
                                  {index === 0 ? (
                                    match.decision === 'UNMATCHED' ? (
                                      <Button type='button' size='sm' variant='secondary' disabled>
                                        자동 채택 안함
                                      </Button>
                                    ) : (
                                      <Button type='button' size='sm' variant='secondary' disabled>
                                        자동 채택됨
                                      </Button>
                                    )
                                  ) : (
                                    <Button
                                      type='button'
                                      size='sm'
                                      variant='outline'
                                      disabled={match.hotel.code === null}
                                      onClick={(): void => setHotelCode(String(match.hotel.code))}
                                    >
                                      검토 코드 사용
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>hotelCode 찾기</CardTitle>
          <CardDescription>
            테스트 전에 조회 조건으로 호텔 목록을 찾고, 원하는 코드로 바로 테스트할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant={searchMode === 'destination' ? 'default' : 'outline'}
              onClick={(): void => setSearchMode('destination')}
            >
              Destination
            </Button>
            <Button
              type='button'
              variant={searchMode === 'geolocation' ? 'default' : 'outline'}
              onClick={(): void => setSearchMode('geolocation')}
            >
              Geolocation
            </Button>
          </div>

          {searchMode === 'destination' ? (
            <div className='space-y-2'>
              <Label htmlFor='hotelbeds-destination-code'>Destination Code</Label>
              <Input
                id='hotelbeds-destination-code'
                value={destinationCode}
                onChange={(e): void => setDestinationCode(e.target.value)}
                placeholder='예: BCN'
              />
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
              <div className='space-y-2'>
                <Label htmlFor='hotelbeds-latitude'>Latitude</Label>
                <Input id='hotelbeds-latitude' value={latitude} onChange={(e): void => setLatitude(e.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='hotelbeds-longitude'>Longitude</Label>
                <Input
                  id='hotelbeds-longitude'
                  value={longitude}
                  onChange={(e): void => setLongitude(e.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='hotelbeds-radius'>Radius</Label>
                <Input id='hotelbeds-radius' value={radius} onChange={(e): void => setRadius(e.target.value)} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='hotelbeds-unit'>Unit</Label>
                <select
                  id='hotelbeds-unit'
                  value={unit}
                  onChange={(e): void => setUnit((e.target.value === 'mi' ? 'mi' : 'km') as 'km' | 'mi')}
                  className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                >
                  <option value='km'>km</option>
                  <option value='mi'>mi</option>
                </select>
              </div>
            </div>
          )}

          {!canSearch && (
            <div className='flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700'>
              <AlertCircle className='size-4' />
              조회 조건을 입력해주세요.
            </div>
          )}

          <Button type='button' onClick={runHotelSearch} disabled={!canSearch || searchLoading}>
            {searchLoading ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Search className='mr-2 size-4' />}
            {searchLoading ? '조회 중...' : '호텔 조회'}
          </Button>

          {searchResult && (
            <div className='space-y-3'>
              <div className='flex flex-wrap items-center gap-2 text-sm'>
                <Badge variant={searchResult.success ? 'default' : 'destructive'}>
                  {searchResult.success ? 'Success' : 'Failed'}
                </Badge>
                {typeof searchResult.durationMs === 'number' && (
                  <Badge variant='outline'>{searchResult.durationMs}ms</Badge>
                )}
                {typeof searchResult.count === 'number' && <Badge variant='outline'>{searchResult.count} hotels</Badge>}
              </div>

              {searchResult.error && (
                <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>{searchResult.error}</div>
              )}
              {searchResult.body && (
                <pre className='max-h-48 overflow-auto rounded-md border bg-muted p-3 text-xs'>{searchResult.body}</pre>
              )}

              {searchResult.hotels && searchResult.hotels.length > 0 && (
                <div className='overflow-x-auto rounded-md border'>
                  <table className='min-w-full text-sm'>
                    <thead className='bg-muted/60 text-left'>
                      <tr>
                        <th className='px-3 py-2'>Code</th>
                        <th className='px-3 py-2'>Name</th>
                        <th className='px-3 py-2'>Destination</th>
                        <th className='px-3 py-2'>Rate</th>
                        <th className='px-3 py-2'>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResult.hotels.map((hotel) => (
                        <tr key={`${hotel.code ?? 'unknown'}-${hotel.name ?? ''}`} className='border-t'>
                          <td className='px-3 py-2 font-mono'>{hotel.code ?? '-'}</td>
                          <td className='px-3 py-2'>{hotel.name ?? '-'}</td>
                          <td className='px-3 py-2'>
                            {hotel.destinationName ?? '-'}
                            {hotel.destinationCode ? ` (${hotel.destinationCode})` : ''}
                          </td>
                          <td className='px-3 py-2'>
                            {hotel.currency && hotel.minRate !== null ? `${hotel.currency} ${hotel.minRate}` : '-'}
                          </td>
                          <td className='px-3 py-2'>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              disabled={hotel.code === null}
                              onClick={(): void => setHotelCode(String(hotel.code))}
                            >
                              <MapPin className='mr-1 size-3' />이 코드 사용
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>테스트 입력</CardTitle>
          <CardDescription>합법적 API 조회를 위해 `hotelCode` 기준으로 빈방 여부를 테스트합니다.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='space-y-2'>
            <Label htmlFor='hotelbeds-hotel-code'>Hotel Code</Label>
            <Input
              id='hotelbeds-hotel-code'
              value={hotelCode}
              onChange={(e): void => setHotelCode(e.target.value)}
              placeholder='예: 12345'
            />
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
            <div className='space-y-2'>
              <Label htmlFor='hotelbeds-check-in'>체크인</Label>
              <Input
                id='hotelbeds-check-in'
                type='date'
                value={checkIn}
                onChange={(e): void => setCheckIn(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='hotelbeds-check-out'>체크아웃</Label>
              <Input
                id='hotelbeds-check-out'
                type='date'
                value={checkOut}
                onChange={(e): void => setCheckOut(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='hotelbeds-adults'>성인</Label>
              <Input
                id='hotelbeds-adults'
                type='number'
                min={1}
                max={20}
                value={adults}
                onChange={(e): void => setAdults(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='hotelbeds-rooms'>객실 수</Label>
              <Input
                id='hotelbeds-rooms'
                type='number'
                min={1}
                max={8}
                value={rooms}
                onChange={(e): void => setRooms(parseInt(e.target.value, 10) || 1)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>워커 요청 URL(미리보기)</Label>
            <pre className='overflow-auto rounded-md border bg-muted p-3 text-xs text-muted-foreground'>
              {requestPreviewUrl || '(입력 대기 중)'}
            </pre>
          </div>

          {!canSubmit && (
            <div className='flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700'>
              <AlertCircle className='size-4' />
              체크인/체크아웃 날짜를 확인하고 필수 입력값을 채워주세요.
            </div>
          )}

          <Button type='button' onClick={runTest} disabled={!canSubmit || loading}>
            {loading ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Beaker className='mr-2 size-4' />}
            {loading ? '테스트 실행 중...' : 'Hotelbeds 테스트 실행'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>결과</CardTitle>
          <CardDescription>API/워커 응답을 그대로 확인하고 실패 케이스를 수집하세요.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {!response && <p className='text-sm text-muted-foreground'>아직 실행된 테스트가 없습니다.</p>}

          {response && (
            <>
              <div className='flex flex-wrap items-center gap-2'>
                {response.success ? (
                  <Badge className='bg-status-success text-status-success-foreground'>
                    <CheckCircle2 className='mr-1 size-3' />
                    Success
                  </Badge>
                ) : (
                  <Badge className='bg-status-error text-status-error-foreground'>
                    <XCircle className='mr-1 size-3' />
                    Failed
                  </Badge>
                )}
                <Badge variant='outline'>{response.durationMs}ms</Badge>
                {response.result && (
                  <Badge variant={response.result.available ? 'default' : 'secondary'}>
                    {response.result.available ? '예약 가능' : '예약 불가'}
                  </Badge>
                )}
                {response.result?.price && <Badge variant='outline'>{response.result.price}</Badge>}
              </div>

              {response.error && (
                <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>{response.error}</div>
              )}

              {response.result?.reason && (
                <div className='rounded-md border bg-muted/40 p-3 text-sm'>
                  <span className='font-medium'>사유:</span> {response.result.reason}
                </div>
              )}

              {response.request && (
                <div className='space-y-2'>
                  <Label>요청 요약</Label>
                  <pre className='overflow-auto rounded-md border bg-muted p-3 text-xs'>
                    {JSON.stringify(response.request, null, 2)}
                  </pre>
                </div>
              )}

              {response.raw && (
                <div className='space-y-2'>
                  <Label>원본 응답(raw)</Label>
                  <pre className='max-h-[420px] overflow-auto rounded-md border bg-muted p-3 text-xs'>
                    {JSON.stringify(response.raw, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>기능 개발 방향 메모</CardTitle>
          <CardDescription>이 실험 화면으로 먼저 검증한 뒤, 본 등록 플로우에 반영하세요.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>1. `hotelCode`로 성공/실패 샘플을 최소 30건 확보해서 실패 유형(인증/코드오류/재고없음)을 분류합니다.</p>
          <p>2. 등록 데이터 모델을 `url` 중심에서 `platformId(hotelCode)` 중심으로 전환할지 판단합니다.</p>
          <p>3. Content API 기반 호텔 검색 UI를 붙여서 유저가 코드 직접 입력 없이 선택하도록 확장합니다.</p>
          <p>4. 최종 화면 문구는 `예약 가능/예약 불가/확인 불가` 3상태로 단순화합니다.</p>
        </CardContent>
      </Card>
    </main>
  );
}
