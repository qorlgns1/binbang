import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { deleteAdminPlan, updateAdminPlan } from '@/services/admin/plans.service';

const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  interval: z.string().optional(),
  maxAccommodations: z.number().min(1).optional(),
  checkIntervalMin: z.number().min(1).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const updatedPlan = await updateAdminPlan(id, parsed.data);

    return NextResponse.json(updatedPlan);
  } catch (error) {
    return handleServiceError(error, 'Admin plan update error');
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;

    await deleteAdminPlan(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error, 'Admin plan delete error');
  }
}
