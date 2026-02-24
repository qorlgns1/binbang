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
import { createAdminPlan, getAdminPlans } from '@/services/admin/plans.service';

export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const plans = await getAdminPlans();

    return NextResponse.json(plans);
  } catch (error) {
    return handleServiceError(error, 'Admin plans fetch error');
  }
}

const createPlanSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  description: z.string().nullable().optional(),
  price: z.number().min(0),
  interval: z.string().default('month'),
  maxAccommodations: z.number().min(1),
  checkIntervalMin: z.number().min(1),
});

export async function POST(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequestResponse('Invalid JSON');
    }
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const plan = await createAdminPlan(parsed.data);

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return handleServiceError(error, 'Admin plan create error');
  }
}
