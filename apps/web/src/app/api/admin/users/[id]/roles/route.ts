import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { updateUserRoles } from '@/services/admin/usersService';

const rolesUpdateSchema = z.object({
  roles: z.array(z.string()).min(1, '최소 1개의 역할이 필요합니다'),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    if (session.user.id === id) {
      return NextResponse.json({ error: '자기 자신의 역할은 변경할 수 없습니다' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = rolesUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
    }

    const result = await updateUserRoles({
      userId: id,
      roles: parsed.data.roles,
      changedById: session.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }
    console.error('Admin roles update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
