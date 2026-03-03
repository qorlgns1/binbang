'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CheckCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUserMessage, parseApiError } from '@/lib/apiError';
import { parseAccommodationUrl } from '@/lib/urlParser';
import type { ParsedAccommodationUrl } from '@/types/url';

type FormField = 'userId' | 'name' | 'url' | 'platform' | 'checkIn' | 'checkOut' | 'adults';

async function submitAdminAccommodation(body: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/admin/accommodations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw await parseApiError(res, '숙소 등록에 실패했습니다');
  }
}

export function AdminAccommodationForm(): React.ReactElement {
  const router = useRouter();

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<'AIRBNB' | 'AGODA'>('AIRBNB');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);

  const [parsedInfo, setParsedInfo] = useState<ParsedAccommodationUrl | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [success, setSuccess] = useState(false);

  // URL 변경 시 자동 파싱 (디바운스)
  // biome-ignore lint/correctness/useExhaustiveDependencies: url change only
  useEffect(() => {
    if (!url) {
      setParsedInfo(null);
      return;
    }

    const timer = setTimeout(() => {
      const parsed = parseAccommodationUrl(url);
      setParsedInfo(parsed);

      if (parsed.platform) {
        if (parsed.checkIn && !checkIn) setCheckIn(parsed.checkIn);
        if (parsed.checkOut && !checkOut) setCheckOut(parsed.checkOut);
        if (parsed.adults && adults === 2) setAdults(parsed.adults);
        if (parsed.name && !name) setName(parsed.name);
        if (parsed.platform === 'AGODA') setPlatform('AGODA');
        else if (parsed.platform === 'AIRBNB') setPlatform('AIRBNB');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [url]);

  function applyParsedInfo(): void {
    if (!parsedInfo) return;
    if (parsedInfo.checkIn) setCheckIn(parsedInfo.checkIn);
    if (parsedInfo.checkOut) setCheckOut(parsedInfo.checkOut);
    if (parsedInfo.adults) setAdults(parsedInfo.adults);
    if (parsedInfo.name) setName(parsedInfo.name);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);
    setIsPending(true);

    try {
      const baseUrl = parsedInfo?.baseUrl ?? url;
      await submitAdminAccommodation({
        ...(userId ? { userId } : {}),
        name,
        platform,
        url: baseUrl,
        checkIn,
        checkOut,
        adults,
      });

      setSuccess(true);
      // 폼 초기화
      setName('');
      setUrl('');
      setCheckIn('');
      setCheckOut('');
      setAdults(2);
      setUserId('');
      setParsedInfo(null);

      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(getUserMessage(err));
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={() => {
        setError(null);
        setFieldErrors({});
        setSuccess(false);
      }}
      className='space-y-5'
    >
      {success && (
        <Alert className='border-chart-3/30 bg-chart-3/5'>
          <CheckCircle className='size-4 text-chart-3' />
          <AlertTitle>등록 완료</AlertTitle>
          <AlertDescription>숙소가 성공적으로 등록되었습니다.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant='destructive'>
          <AlertTitle>오류</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 대상 사용자 ID */}
      <div className='space-y-2'>
        <Label htmlFor='userId'>사용자 ID (선택)</Label>
        <Input
          id='userId'
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder='cuid... (비워두면 어드민 본인 계정에 등록)'
          className='font-mono text-sm'
        />
        {fieldErrors.userId && <p className='text-xs text-destructive'>{fieldErrors.userId}</p>}
      </div>

      {/* 숙소 URL */}
      <div className='space-y-2'>
        <Label htmlFor='url'>숙소 URL *</Label>
        <Input
          type='url'
          id='url'
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder='https://www.airbnb.co.kr/rooms/...'
        />
        {fieldErrors.url && <p className='text-xs text-destructive'>{fieldErrors.url}</p>}

        {parsedInfo?.platform && (
          <Alert className='border-chart-3/30 bg-chart-3/5'>
            <div className='flex items-center justify-between gap-4'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='size-4 text-chart-3' />
                <AlertTitle className='text-sm font-medium'>URL에서 정보를 찾았습니다</AlertTitle>
              </div>
              <Button type='button' size='sm' onClick={applyParsedInfo}>
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

      {/* 숙소명 + 플랫폼 */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='name'>숙소 이름 *</Label>
          <Input
            id='name'
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='예: 그린델발트 샬레'
          />
          {fieldErrors.name && <p className='text-xs text-destructive'>{fieldErrors.name}</p>}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='platform'>플랫폼 *</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as 'AIRBNB' | 'AGODA')}>
            <SelectTrigger id='platform'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='AIRBNB'>AIRBNB</SelectItem>
              <SelectItem value='AGODA'>AGODA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 날짜 */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='checkIn'>체크인 *</Label>
          <Input
            type='date'
            id='checkIn'
            required
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
          {fieldErrors.checkIn && <p className='text-xs text-destructive'>{fieldErrors.checkIn}</p>}
        </div>
        <div className='space-y-2'>
          <Label htmlFor='checkOut'>체크아웃 *</Label>
          <Input
            type='date'
            id='checkOut'
            required
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          {fieldErrors.checkOut && <p className='text-xs text-destructive'>{fieldErrors.checkOut}</p>}
        </div>
      </div>

      {/* 인원 */}
      <div className='space-y-2'>
        <Label htmlFor='adults'>인원</Label>
        <Input
          type='number'
          id='adults'
          min='1'
          max='20'
          value={adults}
          onChange={(e) => setAdults(parseInt(e.target.value, 10) || 2)}
          className='w-32'
        />
      </div>

      <Button type='submit' disabled={isPending}>
        {isPending ? '등록 중...' : '숙소 등록'}
      </Button>
    </form>
  );
}
