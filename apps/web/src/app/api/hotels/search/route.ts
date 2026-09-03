import { NextResponse } from 'next/server';

import { searchAgodaHotels } from '@/services/agoda-hotels.service';

/**
 * 숙소 검색.
 *
 * 홈 화면이 로그인 전에 검색을 제공하므로 인증을 요구하지 않는다.
 * 외부 API가 아니라 우리 DB(`agoda_hotels`)를 조회하며,
 * 호출량은 미들웨어의 경로 레이트 제한으로 방어한다.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';

  try {
    const hotels = await searchAgodaHotels(q);

    return NextResponse.json({
      hotels,
    });
  } catch (error) {
    console.error('[hotels/search] error:', error);
    return NextResponse.json(
      { error: { code: 'SEARCH_FAILED', message: '검색 중 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
