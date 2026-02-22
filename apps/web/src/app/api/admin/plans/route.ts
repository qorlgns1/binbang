import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { createAdminPlan, getAdminPlans } from '@/services/admin/plans.service';

export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const plans = await getAdminPlans();

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Admin plans fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.issues }, { status: 400 });
    }

    const plan = await createAdminPlan(parsed.data);

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Plan name already exists') {
      return NextResponse.json({ error: '이미 존재하는 플랜 이름입니다' }, { status: 400 });
    }
    console.error('Admin plan create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
