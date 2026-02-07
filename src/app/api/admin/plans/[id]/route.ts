import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const updatedPlan = await updateAdminPlan(id, parsed.data);

    return NextResponse.json(updatedPlan);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan not found') {
        return NextResponse.json({ error: '플랜을 찾을 수 없습니다' }, { status: 404 });
      }
      if (error.message === 'Plan name already exists') {
        return NextResponse.json({ error: '이미 존재하는 플랜 이름입니다' }, { status: 400 });
      }
    }
    console.error('Admin plan update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await deleteAdminPlan(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan not found') {
        return NextResponse.json({ error: '플랜을 찾을 수 없습니다' }, { status: 404 });
      }
      if (error.message.startsWith('Cannot delete plan with')) {
        const match = error.message.match(/(\d+)/);
        const userCount = match ? match[1] : '0';
        return NextResponse.json(
          { error: `이 플랜을 사용 중인 유저가 ${userCount}명 있습니다. 먼저 다른 플랜으로 변경해주세요.` },
          { status: 400 },
        );
      }
    }
    console.error('Admin plan delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
