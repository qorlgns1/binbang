import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { linkAccommodation } from '@/services/cases.service';

const accommodationSchema = z.object({
  accommodationId: z.string().min(1),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_case_accommodation');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = accommodationSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const result = await linkAccommodation({
      caseId: id,
      accommodationId: parsed.data.accommodationId,
      changedById: session.user.id,
    });

    return NextResponse.json({ case: result });
  } catch (error) {
    return handleServiceError(error, 'Admin accommodation link error', requestId);
  }
}
