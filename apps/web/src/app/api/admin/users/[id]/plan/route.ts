import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { updateUserPlan } from '@/services/admin/users.service';

const planUpdateSchema = z.object({
  planName: z.string(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_user_plan');
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse('Unauthorized', requestId);
  }

  try {
    const { id } = await params;

    const body = await request.json();
    const parsed = planUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const result = await updateUserPlan({
      userId: id,
      planName: parsed.data.planName,
      changedById: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error, 'Admin plan update error', requestId);
  }
}
