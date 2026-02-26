import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { searchAgodaHotels } from '@/services/agoda-hotels.service';

export async function GET(request: Request): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' } }, { status: 401 });
  }

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
