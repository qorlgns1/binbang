import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { confirmPayment } from '@/services/cases.service';

const paymentSchema = z.object({
  note: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_case_payment');
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse('Unauthorized', requestId);
  }

  try {
    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON', undefined, requestId);
    }
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const result = await confirmPayment({
      caseId: id,
      confirmedById: session.user.id,
      note: parsed.data.note,
    });

    return NextResponse.json({ case: result });
  } catch (error) {
    return handleServiceError(error, 'Admin payment confirmation error', requestId);
  }
}
