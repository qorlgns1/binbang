import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { savePricingQuoteSchema } from '@/lib/schemas/pricing-quote';
import { getCasePriceQuoteHistory, saveCasePriceQuote } from '@/services/pricing.service';

type ErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'NOT_FOUND' | 'INTERNAL_SERVER_ERROR';

function makeRequestId(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  const entropy = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `req_${timestamp}_${entropy}`;
}

function errorResponse(status: number, code: ErrorCode, message: string, requestId: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId,
      },
    },
    { status },
  );
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = makeRequestId();
  const session = await requireAdmin();

  if (!session) {
    return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', requestId);
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
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Case not found') {
      return errorResponse(404, 'NOT_FOUND', message, requestId);
    }

    console.error('[admin/cases/:id/pricing/quotes] get error', { requestId, error });
    return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Internal server error', requestId);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = makeRequestId();
  const session = await requireAdmin();

  if (!session) {
    return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_REQUEST', 'Invalid request payload', requestId);
  }

  const parsed = savePricingQuoteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, 'BAD_REQUEST', 'Invalid request payload', requestId);
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
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message === 'Case not found') {
      return errorResponse(404, 'NOT_FOUND', message, requestId);
    }

    if (message === '`changeReason` is required') {
      return errorResponse(400, 'BAD_REQUEST', message, requestId);
    }

    console.error('[admin/cases/:id/pricing/quotes] error', { requestId, error });
    return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Internal server error', requestId);
  }
}
