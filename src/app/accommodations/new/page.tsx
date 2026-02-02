'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAccommodation } from '@/hooks/useCreateAccommodation';
import { parseAccommodationUrl } from '@/lib/url-parser';
import type { ParsedAccommodationUrl } from '@/types/url';

export default function NewAccommodationPage() {
  const router = useRouter();
  const createMutation = useCreateAccommodation();
  const [parsedInfo, setParsedInfo] = useState<ParsedAccommodationUrl | null>(null);

  // 폼 상태
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);

  // URL 변경 시 자동 파싱
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!url) {
      setParsedInfo(null);
      return;
    }

    // 디바운스: 타이핑 완료 후 파싱
    const timer = setTimeout(() => {
      const parsed = parseAccommodationUrl(url);
      setParsedInfo(parsed);

      // 파싱된 값으로 폼 자동 채우기
      if (parsed.platform) {
        if (parsed.checkIn && !checkIn) setCheckIn(parsed.checkIn);
        if (parsed.checkOut && !checkOut) setCheckOut(parsed.checkOut);
        if (parsed.adults && adults === 2) setAdults(parsed.adults);
        if (parsed.name && !name) setName(parsed.name);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  // "파싱된 정보로 채우기" 버튼
  function applyParsedInfo() {
    if (!parsedInfo) return;

    if (parsedInfo.checkIn) setCheckIn(parsedInfo.checkIn);
    if (parsedInfo.checkOut) setCheckOut(parsedInfo.checkOut);
    if (parsedInfo.adults) setAdults(parsedInfo.adults);
    if (parsedInfo.name) setName(parsedInfo.name);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // URL에서 플랫폼 자동 감지
    let platform = 'AIRBNB';
    if (url.includes('agoda')) {
      platform = 'AGODA';
    }

    // 기본 URL 사용 (쿼리 파라미터 제거된 버전)
    const baseUrl = parsedInfo?.baseUrl || url;

    createMutation.mutate(
      { name, platform, url: baseUrl, checkIn, checkOut, adults },
      {
        onSuccess: () => {
          router.push('/dashboard');
          router.refresh();
        },
      },
    );
  }

  return (
    <div className='min-h-screen bg-muted/40'>
      <header className='bg-background/80 backdrop-blur-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <Link
            href='/dashboard'
            className='text-muted-foreground hover:text-foreground'
          >
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </header>

      <main className='max-w-2xl mx-auto px-4 py-8'>
        <Card className='gap-6'>
          <CardHeader>
            <CardTitle className='text-2xl'>숙소 추가</CardTitle>
          </CardHeader>
          <CardContent>
            {createMutation.error && (
              <Alert
                variant='destructive'
                className='mb-6'
              >
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{createMutation.error.message}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              onChange={() => createMutation.reset()}
              className='space-y-6'
            >
              {/* URL 입력 */}
              <div className='space-y-2'>
                <Label htmlFor='url'>숙소 URL *</Label>
                <Input
                  type='url'
                  id='url'
                  name='url'
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder='https://www.airbnb.co.kr/rooms/12345678?check_in=...'
                />
                <p className='text-xs text-muted-foreground'>
                  Airbnb 또는 Agoda 숙소 페이지 URL을 붙여넣으세요. 날짜와 인원이 자동으로 입력됩니다.
                </p>

                {/* 파싱 결과 표시 */}
                {parsedInfo?.platform && (
                  <Alert className='border-info-border bg-info text-info-foreground'>
                    <div className='flex items-center justify-between gap-4'>
                      <AlertTitle className='text-sm font-medium text-info-foreground'>
                        🔍 URL에서 정보를 찾았습니다
                      </AlertTitle>
                      <Button
                        type='button'
                        size='sm'
                        onClick={applyParsedInfo}
                      >
                        모두 적용
                      </Button>
                    </div>
                    <AlertDescription className='text-xs text-info-foreground/80 space-y-1 mt-2'>
                      <p>• 플랫폼: {parsedInfo.platform}</p>
                      {parsedInfo.name && <p>• 숙소명: {parsedInfo.name}</p>}
                      {parsedInfo.checkIn && <p>• 체크인: {parsedInfo.checkIn}</p>}
                      {parsedInfo.checkOut && <p>• 체크아웃: {parsedInfo.checkOut}</p>}
                      {parsedInfo.adults && <p>• 인원: {parsedInfo.adults}명</p>}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* 숙소 이름 */}
              <div className='space-y-2'>
                <Label htmlFor='name'>숙소 이름 *</Label>
                <Input
                  type='text'
                  id='name'
                  name='name'
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='예: 그린델발트 샬레'
                />
              </div>

              {/* 날짜 선택 */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='checkIn'>체크인 *</Label>
                  <Input
                    type='date'
                    id='checkIn'
                    name='checkIn'
                    required
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='checkOut'>체크아웃 *</Label>
                  <Input
                    type='date'
                    id='checkOut'
                    name='checkOut'
                    required
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
                </div>
              </div>

              {/* 인원 */}
              <div className='space-y-2'>
                <Label htmlFor='adults'>인원</Label>
                <Input
                  type='number'
                  id='adults'
                  name='adults'
                  min='1'
                  max='20'
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value) || 2)}
                />
              </div>

              {/* 버튼 */}
              <div className='flex gap-4'>
                <Button
                  type='submit'
                  disabled={createMutation.isPending}
                  className='flex-1'
                >
                  {createMutation.isPending ? '추가 중...' : '숙소 추가'}
                </Button>
                <Button
                  asChild
                  variant='outline'
                >
                  <Link href='/dashboard'>취소</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
