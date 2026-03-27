import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { searchAgodaAvailability } from '@/lib/agoda/searchClient';
import { summarizeAgodaPayload } from '@/lib/agoda/summary';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';

const testSchema = z.object({
  hotelId: z.number().int().positive('호텔 ID를 입력해주세요'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.number().int().min(1).max(20).default(2),
  children: z.number().int().min(0).max(10).default(0),
  rooms: z.number().int().min(1).max(10).default(1),
  currency: z.string().length(3).default('KRW'),
  locale: z.string().default('ko-kr'),
  waitTime: z.number().int().min(1).max(60).default(20),
  includeMetaSearch: z.boolean().default(true),
});

export async function POST(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON' } }, { status: 400 });
  }

  const parsed = testSchema.safeParse(body);
  if (!parsed.success) return validationErrorResponse(parsed.error.issues);

  const { hotelId, checkIn, checkOut, adults, children, rooms, currency, locale, waitTime, includeMetaSearch } =
    parsed.data;
  const extra: Array<'rateDetail' | 'metaSearch'> = includeMetaSearch ? ['rateDetail', 'metaSearch'] : ['rateDetail'];

  try {
    const startedAt = Date.now();

    const apiResult = await searchAgodaAvailability({
      waitTime,
      criteria: {
        propertyIds: [BigInt(hotelId)],
        checkIn,
        checkOut,
        rooms,
        adults,
        children,
        currency,
        language: locale,
      },
      features: {
        ratesPerProperty: 25,
        extra,
      },
    });

    const latencyMs = Date.now() - startedAt;
    const summary = summarizeAgodaPayload(apiResult.payload);

    return NextResponse.json({
      httpStatus: apiResult.httpStatus,
      latencyMs,
      requestedExtra: extra,
      availability: summary.availability,
      offerCount: summary.normalizedOfferCount,
      normalizedOfferCount: summary.normalizedOfferCount,
      landingUrlDetectedCount: summary.landingUrlDetectedCount,
      landingUrlSample: summary.landingUrlSample,
      offers: summary.normalizedOffers,
    });
  } catch (error) {
    return handleServiceError(error, 'Agoda API 테스트 오류');
  }
}
