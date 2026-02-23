import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { getUserDetail } from '@/services/admin/users.service';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;

    const result = await getUserDetail(id);

    if (!result) {
      return notFoundResponse('사용자를 찾을 수 없습니다');
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
    return handleServiceError(error, 'Admin user detail fetch error');
  }
}
