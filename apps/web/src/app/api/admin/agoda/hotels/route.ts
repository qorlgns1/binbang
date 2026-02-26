import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { searchAgodaHotels } from '@/services/admin/agoda-hotel.service';

export async function GET(req: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const countryCode = url.searchParams.get('countryCode') ?? undefined;
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 50);

  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }

  try {
    const results = await searchAgodaHotels(q, { countryCode, limit });
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return handleServiceError(err, 'Agoda hotel name search error');
  }
}
