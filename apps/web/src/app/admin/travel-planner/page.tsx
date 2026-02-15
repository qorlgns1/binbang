'use client';

import { useState } from 'react';

import { AlertCircle, Calculator, Loader2, MapPin, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface TravelScoreResponse {
  success: boolean;
  overallScore: number;
  breakdown: {
    weather: {
      score: number;
      data: {
        temperature: number;
        condition: string;
        description: string;
        precipitationProbability: number;
      } | null;
      error?: string;
    };
    exchangeRate: {
      score: number;
      data: {
        baseCurrency: string;
        targetCurrency: string;
        rate: number;
        lastUpdate: string;
      } | null;
      trend: string;
      error?: string;
    };
  };
  recommendation: string;
  durationMs: number;
  error?: string;
}

// 주요 한국 도시 좌표
const POPULAR_DESTINATIONS = [
  { name: '제주도', lat: 33.4996, lon: 126.5312 },
  { name: '서울', lat: 37.5665, lon: 126.978 },
  { name: '부산', lat: 35.1796, lon: 129.0756 },
  { name: '강릉', lat: 37.7519, lon: 128.8761 },
  { name: '여수', lat: 34.7604, lon: 127.6622 },
];

function dateAt(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 70) return 'default';
  if (score >= 50) return 'secondary';
  return 'destructive';
}

export default function TravelPlannerLabPage(): React.ReactElement {
  const [destination, setDestination] = useState('제주도');
  const [latitude, setLatitude] = useState(33.4996);
  const [longitude, setLongitude] = useState(126.5312);
  const [checkInDate, setCheckInDate] = useState((): string => dateAt(7));
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<TravelScoreResponse | null>(null);

  const canSubmit = destination.trim().length > 0 && checkInDate.length > 0;

  const handleDestinationSelect = (name: string, lat: number, lon: number): void => {
    setDestination(name);
    setLatitude(lat);
    setLongitude(lon);
  };

  const runCalculation = async (): Promise<void> => {
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/travel-planner/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          latitude,
          longitude,
          checkInDate,
        }),
      });

      const data = (await res.json()) as TravelScoreResponse;
      setResponse(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setResponse({
        success: false,
        overallScore: 0,
        breakdown: {
          weather: { score: 0, data: null },
          exchangeRate: { score: 0, data: null, trend: '정보 없음' },
        },
        recommendation: '',
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
          <Calculator className='size-7 text-primary' />
          Travel Planner Lab
        </h1>
        <p className='text-base text-muted-foreground'>
          무료 API 조합으로 여행 최적 타이밍을 분석합니다. 날씨 + 환율 기반 점수 계산 (MVP).
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>여행 정보 입력</CardTitle>
          <CardDescription>목적지와 체크인 날짜를 입력하면 여행 점수를 계산합니다.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='space-y-2'>
            <Label>인기 목적지</Label>
            <div className='flex flex-wrap gap-2'>
              {POPULAR_DESTINATIONS.map((dest) => (
                <Button
                  key={dest.name}
                  type='button'
                  variant={destination === dest.name ? 'default' : 'outline'}
                  size='sm'
                  onClick={(): void => handleDestinationSelect(dest.name, dest.lat, dest.lon)}
                >
                  <MapPin className='mr-1 size-3' />
                  {dest.name}
                </Button>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='destination'>목적지</Label>
              <Input
                id='destination'
                value={destination}
                onChange={(e): void => setDestination(e.target.value)}
                placeholder='예: 제주도'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='latitude'>위도</Label>
              <Input
                id='latitude'
                type='number'
                step='0.0001'
                value={latitude}
                onChange={(e): void => setLatitude(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='longitude'>경도</Label>
              <Input
                id='longitude'
                type='number'
                step='0.0001'
                value={longitude}
                onChange={(e): void => setLongitude(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='check-in-date'>체크인 날짜</Label>
            <Input
              id='check-in-date'
              type='date'
              value={checkInDate}
              onChange={(e): void => setCheckInDate(e.target.value)}
            />
          </div>

          {!canSubmit && (
            <div className='flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700'>
              <AlertCircle className='size-4' />
              목적지와 체크인 날짜를 입력해주세요.
            </div>
          )}

          <Button type='button' onClick={runCalculation} disabled={!canSubmit || loading}>
            {loading ? <Loader2 className='mr-2 size-4 animate-spin' /> : <Calculator className='mr-2 size-4' />}
            {loading ? '계산 중...' : '여행 점수 계산'}
          </Button>
        </CardContent>
      </Card>

      {response && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>종합 점수</CardTitle>
              <CardDescription>날씨와 환율을 종합한 여행 적합도</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {response.success ? (
                <>
                  <div className='flex items-center gap-3'>
                    <div className={`text-6xl font-bold ${getScoreColor(response.overallScore)}`}>
                      {response.overallScore}
                    </div>
                    <div className='flex flex-col gap-1'>
                      <Badge variant={getScoreBadgeVariant(response.overallScore)} className='w-fit'>
                        {response.overallScore >= 85
                          ? '완벽'
                          : response.overallScore >= 70
                            ? '좋음'
                            : response.overallScore >= 50
                              ? '보통'
                              : '나쁨'}
                      </Badge>
                      <span className='text-xs text-muted-foreground'>{response.durationMs}ms</span>
                    </div>
                  </div>

                  <div className='rounded-md border bg-muted/40 p-4'>
                    <p className='text-sm font-medium text-foreground'>💡 {response.recommendation}</p>
                  </div>
                </>
              ) : (
                <div className='rounded-md bg-destructive/10 p-3 text-sm text-destructive'>
                  <XCircle className='mr-2 inline size-4' />
                  {response.error || 'Failed to calculate score'}
                </div>
              )}
            </CardContent>
          </Card>

          {response.success && (
            <Card>
              <CardHeader>
                <CardTitle>세부 점수</CardTitle>
                <CardDescription>각 항목별 분석 결과</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* 날씨 점수 */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-base font-semibold'>☀️ 날씨</Label>
                    <Badge variant='outline'>{response.breakdown.weather.score}점</Badge>
                  </div>
                  {response.breakdown.weather.data ? (
                    <div className='rounded-md border bg-card p-3 text-sm'>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <span className='text-muted-foreground'>상태:</span>{' '}
                          <span className='font-medium'>{response.breakdown.weather.data.condition}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>온도:</span>{' '}
                          <span className='font-medium'>{response.breakdown.weather.data.temperature}°C</span>
                        </div>
                        <div className='col-span-2'>
                          <span className='text-muted-foreground'>강수 확률:</span>{' '}
                          <span className='font-medium'>
                            {response.breakdown.weather.data.precipitationProbability}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      <p className='text-sm text-muted-foreground'>날씨 정보를 가져올 수 없습니다.</p>
                      {response.breakdown.weather.error && (
                        <div className='rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-700'>
                          <strong>에러:</strong> {response.breakdown.weather.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 환율 점수 */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Label className='text-base font-semibold'>💰 환율</Label>
                    <Badge variant='outline'>{response.breakdown.exchangeRate.score}점</Badge>
                  </div>
                  {response.breakdown.exchangeRate.data ? (
                    <div className='rounded-md border bg-card p-3 text-sm'>
                      <div className='grid grid-cols-2 gap-2'>
                        <div>
                          <span className='text-muted-foreground'>현재 환율:</span>{' '}
                          <span className='font-medium'>
                            {response.breakdown.exchangeRate.data.rate.toFixed(2)} KRW/USD
                          </span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>추세:</span>{' '}
                          <span className='font-medium'>{response.breakdown.exchangeRate.trend}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>환율 정보를 가져올 수 없습니다.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>다음 단계</CardTitle>
          <CardDescription>Travel Planner 확장 계획</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>
            ✅ <strong>Phase 1 (현재):</strong> 날씨 + 환율 기반 점수 계산
          </p>
          <p>
            🚧 <strong>Phase 2:</strong> 한국관광공사 API 추가 (지역 축제, 관광지 정보)
          </p>
          <p>
            🚧 <strong>Phase 3:</strong> 숙박 가격 히스토리 연동 (자체 DB 데이터)
          </p>
          <p>
            🚧 <strong>Phase 4:</strong> PRO 플랜 기능으로 전환 (일반 사용자 공개)
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
