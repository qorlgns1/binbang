'use client';

import { useState } from 'react';

import { Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseApiError } from '@/lib/apiError';

interface OfferResult {
  offerKey: string;
  propertyId: string;
  roomId: string;
  ratePlanId: string;
  remainingRooms: number | null;
  totalInclusive: number | null;
  currency: string | null;
  freeCancellation: boolean | null;
  landingUrl: string | null;
  payloadHash: string;
}

interface TestResult {
  httpStatus: number;
  latencyMs: number;
  requestedExtra: string[];
  offerCount: number;
  landingUrlDetectedCount: number;
  landingUrlSample: string | null;
  offers: OfferResult[];
}

export function AgodaApiTestPanel(): React.ReactElement {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const dayAfter = new Date(now.getTime() + 2 * 86_400_000);

  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const [hotelId, setHotelId] = useState('');
  const [checkIn, setCheckIn] = useState(fmt(tomorrow));
  const [checkOut, setCheckOut] = useState(fmt(dayAfter));
  const [adults, setAdults] = useState(2);
  const [rooms] = useState(1);
  const [includeMetaSearch, setIncludeMetaSearch] = useState(true);

  const [isPending, setIsPending] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTest(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setResult(null);
    setError(null);
    setIsPending(true);

    try {
      const res = await fetch('/api/admin/agoda/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: parseInt(hotelId, 10),
          checkIn,
          checkOut,
          adults,
          rooms,
          children: 0,
          currency: 'KRW',
          locale: 'ko-kr',
          waitTime: 20,
          includeMetaSearch,
        }),
      });

      if (!res.ok) {
        throw await parseApiError(res, 'API 테스트 실패');
      }

      const data = (await res.json()) as TestResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className='space-y-5'>
      <form onSubmit={handleTest} className='space-y-4'>
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
          <div className='col-span-2 space-y-2 sm:col-span-1'>
            <Label htmlFor='hotelId'>Hotel ID *</Label>
            <Input
              id='hotelId'
              required
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              placeholder='e.g. 123456'
              className='font-mono'
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='testCheckIn'>체크인</Label>
            <Input type='date' id='testCheckIn' value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='testCheckOut'>체크아웃</Label>
            <Input type='date' id='testCheckOut' value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='testAdults'>성인</Label>
            <Input
              type='number'
              id='testAdults'
              min='1'
              max='20'
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value, 10) || 2)}
            />
          </div>
        </div>
        <label className='flex items-center gap-2 text-sm text-muted-foreground'>
          <input type='checkbox' checked={includeMetaSearch} onChange={(e) => setIncludeMetaSearch(e.target.checked)} />
          metaSearch extra 포함 (landingUrl 확보 실험)
        </label>

        <Button type='submit' disabled={isPending} variant='outline' size='sm'>
          {isPending && <Loader2 className='mr-2 size-4 animate-spin' />}
          {isPending ? '호출 중...' : 'Agoda API 테스트'}
        </Button>
      </form>

      {error && (
        <Alert variant='destructive'>
          <AlertTitle>오류</AlertTitle>
          <AlertDescription className='font-mono text-xs'>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className='space-y-3'>
          <div className='flex flex-wrap gap-3 text-sm'>
            <span>
              HTTP <Badge variant='outline'>{result.httpStatus}</Badge>
            </span>
            <span>
              응답시간 <Badge variant='outline'>{result.latencyMs}ms</Badge>
            </span>
            <span>
              오퍼 수 <Badge variant={result.offerCount > 0 ? 'default' : 'secondary'}>{result.offerCount}</Badge>
            </span>
            <span>
              landingUrl 감지{' '}
              <Badge variant={result.landingUrlDetectedCount > 0 ? 'default' : 'secondary'}>
                {result.landingUrlDetectedCount}
              </Badge>
            </span>
            <span>
              extras <Badge variant='outline'>{result.requestedExtra.join(', ')}</Badge>
            </span>
          </div>

          {result.landingUrlSample && (
            <p className='rounded-md border border-border bg-muted/30 p-3 font-mono text-xs break-all'>
              landingUrl sample: {result.landingUrlSample}
            </p>
          )}

          {result.offerCount === 0 && (
            <Alert>
              <AlertTitle>오퍼 없음</AlertTitle>
              <AlertDescription>
                Agoda API에서 해당 조건으로 가용 객실을 찾지 못했습니다. Hotel ID, 날짜, API 자격증명을 확인해주세요.
              </AlertDescription>
            </Alert>
          )}

          {result.offers.length > 0 && (
            <div className='overflow-auto rounded-md border border-border'>
              <table className='w-full text-xs'>
                <thead className='bg-muted/60'>
                  <tr>
                    <th className='px-3 py-2 text-left font-medium'>offerKey</th>
                    <th className='px-3 py-2 text-right font-medium'>remainingRooms</th>
                    <th className='px-3 py-2 text-right font-medium'>totalInclusive</th>
                    <th className='px-3 py-2 text-left font-medium'>currency</th>
                    <th className='px-3 py-2 text-left font-medium'>freeCancellation</th>
                    <th className='px-3 py-2 text-left font-medium'>landingUrl</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {result.offers.map((offer) => (
                    <tr key={offer.offerKey} className='hover:bg-muted/30'>
                      <td className='px-3 py-2 font-mono text-muted-foreground'>{offer.offerKey}</td>
                      <td className='px-3 py-2 text-right'>
                        <Badge
                          variant={
                            offer.remainingRooms == null
                              ? 'secondary'
                              : offer.remainingRooms > 0
                                ? 'default'
                                : 'destructive'
                          }
                        >
                          {offer.remainingRooms ?? 'null'}
                        </Badge>
                      </td>
                      <td className='px-3 py-2 text-right'>{offer.totalInclusive?.toLocaleString() ?? '—'}</td>
                      <td className='px-3 py-2'>{offer.currency ?? '—'}</td>
                      <td className='px-3 py-2'>
                        {offer.freeCancellation == null ? '—' : offer.freeCancellation ? '✓' : '✗'}
                      </td>
                      <td className='max-w-[320px] px-3 py-2 align-top'>
                        {offer.landingUrl ? (
                          <a
                            href={offer.landingUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='font-mono text-[11px] text-primary underline-offset-2 hover:underline'
                          >
                            {offer.landingUrl}
                          </a>
                        ) : (
                          '—'
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
  );
}
