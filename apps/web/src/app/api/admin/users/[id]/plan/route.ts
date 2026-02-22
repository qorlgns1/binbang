import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { updateUserPlan } from '@/services/admin/users.service';

const planUpdateSchema = z.object({
  planName: z.string(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const body = await request.json();
    const parsed = planUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.issues }, { status: 400 });
    }

    const result = await updateUserPlan({
      userId: id,
      planName: parsed.data.planName,
      changedById: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Plan not found') {
        return NextResponse.json({ error: '플랜을 찾을 수 없습니다' }, { status: 404 });
      }
      if (error.message === 'User not found') {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
      }
    }
    console.error('Admin plan update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
