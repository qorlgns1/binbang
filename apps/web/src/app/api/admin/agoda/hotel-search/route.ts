import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { summarizeAgodaPayload } from '@/lib/agoda/summary';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { AgodaConfigError, agodaHotelSearch } from '@/services/admin/agoda.service';

export async function POST(req: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  try {
    const body = await req.json();
    const result = await agodaHotelSearch(body);
    if (!result.ok) {
      return NextResponse.json({
        ...result,
        availability: null,
        normalizedOfferCount: null,
        landingUrlSample: null,
      });
    }

    const summary = summarizeAgodaPayload(result.body);
    return NextResponse.json({
      ...result,
      availability: summary.availability,
      normalizedOfferCount: summary.normalizedOfferCount,
      landingUrlSample: summary.landingUrlSample,
    });
  } catch (err) {
    if (err instanceof AgodaConfigError) {
      return NextResponse.json(
        {
          ok: false,
          error: err.message,
          hint: '.env.local에 AGODA_AFFILIATE_SITE_ID, AGODA_AFFILIATE_API_KEY를 설정하세요.',
        },
        { status: 400 },
      );
    }
    return handleServiceError(err, 'Agoda hotel search error');
  }
}
