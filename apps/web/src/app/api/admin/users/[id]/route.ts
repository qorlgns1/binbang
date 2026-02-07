import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { getUserDetail } from '@/services/admin/users.service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const result = await getUserDetail(id);

    if (!result) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json({
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      image: result.user.image,
      createdAt: result.user.createdAt,
      roles: result.user.roles.map((r: { name: string }): string => r.name),
      planName: result.user.plan?.name ?? null,
      _count: result.user._count,
    });
  } catch (error) {
    console.error('Admin user detail fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
