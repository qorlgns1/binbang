import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { transitionCaseStatus } from '@/services/cases.service';

const transitionSchema = z.object({
  status: z.string().min(1, 'status is required'),
  reason: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const result = await transitionCaseStatus({
      caseId: id,
      toStatus: parsed.data.status as Parameters<typeof transitionCaseStatus>[0]['toStatus'],
      changedById: session.user.id,
      reason: parsed.data.reason,
    });

    return NextResponse.json({ case: result });
  } catch (error) {
    return handleServiceError(error, 'Admin case status transition error');
  }
}
