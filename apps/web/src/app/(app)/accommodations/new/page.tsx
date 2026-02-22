'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { ArrowLeft, CheckCircle, Home } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAccommodation } from '@/hooks/useCreateAccommodation';
import { ApiError, getUserMessage } from '@/lib/apiError';
import { parseAccommodationUrl } from '@/lib/urlParser';
import type { ParsedAccommodationUrl } from '@/types/url';

export default function NewAccommodationPage(): React.ReactElement {
  const t = useTranslations('common');
  const router = useRouter();
  const createMutation = useCreateAccommodation();
  const [parsedInfo, setParsedInfo] = useState<ParsedAccommodationUrl | null>(null);

  // 폼 상태
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [dateError, setDateError] = useState('');

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // URL 변경 시 자동 파싱
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional, runs only on url changes
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
  function applyParsedInfo(): void {
    if (!parsedInfo) return;

    if (parsedInfo.checkIn) setCheckIn(parsedInfo.checkIn);
    if (parsedInfo.checkOut) setCheckOut(parsedInfo.checkOut);
    if (parsedInfo.adults) setAdults(parsedInfo.adults);
    if (parsedInfo.name) setName(parsedInfo.name);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setDateError('');

    if (checkIn < today) {
      setDateError('체크인 날짜는 오늘 이후여야 합니다');
      return;
    }

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
          <Home className='size-8 text-primary' />
        </div>
        <h1 className='mb-3 text-3xl font-semibold text-foreground'>숙소 추가</h1>
        <p className='text-muted-foreground'>
          빈방 소식을 받을 숙소를 등록하세요.
          <br />
          URL만 붙여넣으면 정보가 자동으로 채워집니다.
        </p>
      </div>

      <Card className='border-border/80 bg-card/90 shadow-sm backdrop-blur'>
        <CardHeader>
          <CardTitle>숙소 정보</CardTitle>
          <CardDescription>모든 필수 항목(*)을 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          {(createMutation.error || dateError) && (
            <Alert variant='destructive' className='mb-6'>
              <AlertTitle>
                {createMutation.error instanceof ApiError && createMutation.error.code === 'QUOTA_EXCEEDED'
                  ? '숙소 한도 초과'
                  : '오류'}
              </AlertTitle>
              <AlertDescription>
                <p>{dateError || (createMutation.error ? getUserMessage(createMutation.error) : '')}</p>
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
              setDateError('');
            }}
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
                className='bg-background/80 transition-all focus:bg-background'
              />
              <p className='text-xs text-muted-foreground'>Airbnb 또는 Agoda 숙소 페이지 URL을 붙여넣으세요</p>

              {/* 파싱 결과 표시 */}
              {parsedInfo?.platform && (
                <Alert className='border-chart-3/30 bg-chart-3/5 text-foreground'>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='flex items-center gap-2'>
                      <CheckCircle className='size-4 text-chart-3' />
                      <AlertTitle className='text-sm font-medium text-foreground'>URL에서 정보를 찾았습니다</AlertTitle>
                    </div>
                    <Button
                      type='button'
                      size='sm'
                      onClick={applyParsedInfo}
                      className='bg-primary text-primary-foreground hover:bg-primary/90'
                    >
                      모두 적용
                    </Button>
                  </div>
                  <AlertDescription className='mt-2 space-y-1 text-xs text-muted-foreground'>
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
                className='bg-background/80 transition-all focus:bg-background'
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
                  className='bg-background/80 transition-all focus:bg-background'
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
                onChange={(e) => setAdults(parseInt(e.target.value, 10) || 2)}
                className='bg-background/80 transition-all focus:bg-background'
              />
            </div>

            {/* 버튼 */}
            <div className='flex gap-4'>
              <Button
                type='submit'
                disabled={createMutation.isPending}
                className='flex-1 bg-primary text-primary-foreground hover:bg-primary/90'
              >
                {createMutation.isPending ? '추가 중...' : '숙소 추가'}
              </Button>
              <Button asChild variant='outline' className='border-border'>
                <Link href='/dashboard'>{t('cancel')}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
