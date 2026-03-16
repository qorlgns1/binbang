import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { badRequestResponse, handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { pricingInputSchema } from '@/lib/schemas/pricingQuote';
import { previewCasePriceQuote } from '@/services/pricing.service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_case_pricing_preview');
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

  const parsed = pricingInputSchema.safeParse(body);
  if (!parsed.success) {
    return badRequestResponse('Invalid request payload', undefined, requestId);
  }

  try {
    const { id } = await params;
    const data = await previewCasePriceQuote({
      caseId: id,
      inputsSnapshot: parsed.data,
    });

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    return handleServiceError(error, '[admin/cases/:id/pricing/preview]', requestId);
  }
}
