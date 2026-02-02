'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { type ParsedAccommodationUrl, parseAccommodationUrl } from '@/lib/url-parser';

interface AccommodationData {
  id: string;
  name: string;
  platform: string;
  url: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  isActive: boolean;
}

export default function EditAccommodationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [parsedInfo, setParsedInfo] = useState<ParsedAccommodationUrl | null>(null);

  // 폼 상태
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);

  // 원본 URL (변경 감지용)
  const [originalUrl, setOriginalUrl] = useState('');

  // 숙소 데이터 불러오기
  useEffect(() => {
    async function fetchAccommodation() {
      try {
        const res = await fetch(`/api/accommodations/${id}`);
        if (!res.ok) {
          throw new Error('숙소 정보를 불러올 수 없습니다');
        }
        const data: AccommodationData = await res.json();
        setName(data.name);
        setUrl(data.url);
        setOriginalUrl(data.url);
        setCheckIn(data.checkIn.split('T')[0]);
        setCheckOut(data.checkOut.split('T')[0]);
        setAdults(data.adults);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      } finally {
        setFetching(false);
      }
    }

    fetchAccommodation();
  }, [id]);

  // URL 변경 시 자동 파싱 (URL이 변경된 경우에만)
  /* eslint-disable react-hooks/exhaustive-deps */
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // URL이 변경되었으면 기본 URL 사용
    const submitUrl = url !== originalUrl && parsedInfo?.baseUrl ? parsedInfo.baseUrl : url;

    const data: Record<string, string | number> = {
      name,
      url: submitUrl,
      checkIn,
      checkOut,
      adults,
    };

    try {
      const res = await fetch(`/api/accommodations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '숙소 수정에 실패했습니다');
      }

      router.push(`/accommodations/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <header className='bg-white shadow-sm'>
          <div className='max-w-7xl mx-auto px-4 py-4'>
            <Link
              href={`/accommodations/${id}`}
              className='text-gray-500 hover:text-gray-700'
            >
              ← 숙소 상세로 돌아가기
            </Link>
          </div>
        </header>
        <main className='max-w-2xl mx-auto px-4 py-8'>
          <div className='bg-white rounded-xl shadow-sm p-8 text-center text-gray-500'>불러오는 중...</div>
        </main>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <Link
            href={`/accommodations/${id}`}
            className='text-gray-500 hover:text-gray-700'
          >
            ← 숙소 상세로 돌아가기
          </Link>
        </div>
      </header>

      <main className='max-w-2xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-xl shadow-sm p-8'>
          <h1 className='text-2xl font-bold mb-6'>숙소 정보 수정</h1>

          {error && <div className='bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6'>{error}</div>}

          <form
            onSubmit={handleSubmit}
            className='space-y-6'
          >
            {/* URL 입력 */}
            <div>
              <label
                htmlFor='url'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                숙소 URL *
              </label>
              <input
                type='url'
                id='url'
                name='url'
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder='https://www.airbnb.co.kr/rooms/12345678?check_in=...'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              />
              <p className='text-xs text-gray-500 mt-1'>URL을 변경하면 새 URL에서 정보를 자동으로 파싱합니다.</p>

              {/* 파싱 결과 표시 */}
              {parsedInfo?.platform && (
                <div className='mt-3 p-3 bg-blue-50 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-blue-800'>URL에서 정보를 찾았습니다</span>
                    <button
                      type='button'
                      onClick={applyParsedInfo}
                      className='text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors'
                    >
                      모두 적용
                    </button>
                  </div>
                  <div className='text-xs text-blue-700 space-y-1'>
                    <p>• 플랫폼: {parsedInfo.platform}</p>
                    {parsedInfo.name && <p>• 숙소명: {parsedInfo.name}</p>}
                    {parsedInfo.checkIn && <p>• 체크인: {parsedInfo.checkIn}</p>}
                    {parsedInfo.checkOut && <p>• 체크아웃: {parsedInfo.checkOut}</p>}
                    {parsedInfo.adults && <p>• 인원: {parsedInfo.adults}명</p>}
                  </div>
                </div>
              )}
            </div>

            {/* 숙소 이름 */}
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                숙소 이름 *
              </label>
              <input
                type='text'
                id='name'
                name='name'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='예: 그린델발트 샬레'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              />
            </div>

            {/* 날짜 선택 */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='checkIn'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  체크인 *
                </label>
                <input
                  type='date'
                  id='checkIn'
                  name='checkIn'
                  required
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                />
              </div>
              <div>
                <label
                  htmlFor='checkOut'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  체크아웃 *
                </label>
                <input
                  type='date'
                  id='checkOut'
                  name='checkOut'
                  required
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                />
              </div>
            </div>

            {/* 인원 */}
            <div>
              <label
                htmlFor='adults'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                인원
              </label>
              <input
                type='number'
                id='adults'
                name='adults'
                min='1'
                max='20'
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 2)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              />
            </div>

            {/* 버튼 */}
            <div className='flex gap-4'>
              <button
                type='submit'
                disabled={loading}
                className='flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50'
              >
                {loading ? '수정 중...' : '수정 완료'}
              </button>
              <Link
                href={`/accommodations/${id}`}
                className='px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors'
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
