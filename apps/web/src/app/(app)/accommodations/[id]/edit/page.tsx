'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccommodation } from '@/hooks/useAccommodation';
import { useUpdateAccommodation } from '@/hooks/useUpdateAccommodation';
import { parseAccommodationUrl } from '@/lib/url-parser';
import type { ParsedAccommodationUrl } from '@/types/url';

export default function EditAccommodationPage(): React.ReactElement {
  const t = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data, isPending: fetching, error: fetchError } = useAccommodation(id);
  const updateMutation = useUpdateAccommodation();

  const [parsedInfo, setParsedInfo] = useState<ParsedAccommodationUrl | null>(null);

  // 폼 상태
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);

  // 원본 URL (변경 감지용)
  const [originalUrl, setOriginalUrl] = useState('');

  // 데이터 도착 시 폼 초기화 (1회만)
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (data && !initialized) {
      setName(data.name);
      setUrl(data.url);
      setOriginalUrl(data.url);
      setCheckIn(data.checkIn.split('T')[0]);
      setCheckOut(data.checkOut.split('T')[0]);
      setAdults(data.adults);
      setInitialized(true);
    }
  }, [data, initialized]);

  // URL 변경 시 자동 파싱 (URL이 변경된 경우에만)
  useEffect(() => {
    if (!url || url === originalUrl) {
      setParsedInfo(null);
      return;
    }

    const timer = setTimeout(() => {
      const parsed = parseAccommodationUrl(url);
      setParsedInfo(parsed);
    }, 500);

    return () => clearTimeout(timer);
  }, [url, originalUrl]);

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

    // URL이 변경되었으면 기본 URL 사용
    const submitUrl = url !== originalUrl && parsedInfo?.baseUrl ? parsedInfo.baseUrl : url;

    updateMutation.mutate(
      {
        id,
        data: { name, url: submitUrl, checkIn, checkOut, adults },
      },
      {
        onSuccess: () => {
          router.push(`/accommodations/${id}`);
          router.refresh();
        },
      },
    );
  }

  const errorMessage = fetchError?.message || updateMutation.error?.message || '';

  if (fetching) {
    return (
      <main className='max-w-2xl mx-auto px-4 py-8'>
        <div className='mb-6'>
          <Link href={`/accommodations/${id}`} className='text-sm text-muted-foreground hover:text-foreground'>
            ← 숙소 상세로 돌아가기
          </Link>
        </div>
        <Card>
          <CardContent className='p-8 text-center text-muted-foreground'>불러오는 중...</CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className='max-w-2xl mx-auto px-4 py-8'>
      <div className='mb-6'>
        <Link href={`/accommodations/${id}`} className='text-sm text-muted-foreground hover:text-foreground'>
          ← 숙소 상세로 돌아가기
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>숙소 정보 수정</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant='destructive' className='mb-6'>
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} onChange={() => updateMutation.reset()} className='space-y-6'>
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
              <p className='text-xs text-muted-foreground'>URL을 변경하면 새 URL에서 정보를 자동으로 파싱합니다.</p>

              {/* 파싱 결과 표시 */}
              {parsedInfo?.platform && (
                <Alert className='border-info-border bg-info text-info-foreground'>
                  <div className='flex items-center justify-between gap-4'>
                    <AlertTitle className='text-sm font-medium text-info-foreground'>
                      URL에서 정보를 찾았습니다
                    </AlertTitle>
                    <Button type='button' size='sm' onClick={applyParsedInfo}>
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
                onChange={(e) => setAdults(parseInt(e.target.value, 10) || 2)}
              />
            </div>

            {/* 버튼 */}
            <div className='flex gap-4'>
              <Button type='submit' disabled={updateMutation.isPending} className='flex-1'>
                {updateMutation.isPending ? t('saving') : t('save')}
              </Button>
              <Button asChild variant='outline'>
                <Link href={`/accommodations/${id}`}>{t('cancel')}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
