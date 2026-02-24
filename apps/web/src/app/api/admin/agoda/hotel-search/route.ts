import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { AgodaConfigError, agodaHotelSearch } from '@/services/admin/agoda.service';

export async function POST(req: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const result = await agodaHotelSearch(body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AgodaConfigError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          hint: '.env.local에 AGODA_API_KEY를 설정하세요. 형식: {siteid}:{apikey}',
        },
        { status: 400 },
      );
    }
    return handleServiceError(err, 'Agoda hotel search error');
  }
}
