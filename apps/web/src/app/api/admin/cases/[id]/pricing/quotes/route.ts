import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { badRequestResponse, handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { savePricingQuoteSchema } from '@/lib/schemas/pricingQuote';
import { getCasePriceQuoteHistory, saveCasePriceQuote } from '@/services/pricing.service';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_case_pricing_quotes');
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse('Unauthorized', requestId);
  }

  try {
    const { id } = await params;
    const quotes = await getCasePriceQuoteHistory(id, 50);

    return NextResponse.json({
      ok: true,
      data: {
        quotes,
      },
    });
  } catch (error) {
    return handleServiceError(error, '[admin/cases/:id/pricing/quotes] get', requestId);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_case_pricing_quote_create');
  const session = await requireAdmin();

  if (!session) {
    return unauthorizedResponse('Unauthorized', requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse('Invalid request payload', undefined, requestId);
  }

  const parsed = savePricingQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse('Invalid request payload', undefined, requestId);
  }

  try {
    const { id } = await params;
    const data = await saveCasePriceQuote({
      caseId: id,
      createdBy: session.user.id,
      changeReason: parsed.data.changeReason,
      inputsSnapshot: {
        platform: parsed.data.platform,
        durationBucket: parsed.data.durationBucket,
        difficulty: parsed.data.difficulty,
        urgencyBucket: parsed.data.urgencyBucket,
        frequencyBucket: parsed.data.frequencyBucket,
      },
    });

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    return handleServiceError(error, '[admin/cases/:id/pricing/quotes]', requestId);
  }
}
