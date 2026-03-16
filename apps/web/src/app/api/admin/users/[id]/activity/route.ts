import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { checkUserExists, getUserActivity } from '@/services/admin/users.service';
import type { ActivityType } from '@/types/activity';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const requestId = createRequestId('admin_user_activity');
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse('Unauthorized', requestId);
  }

  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10), 1), 100);
    const typeFilter = (searchParams.get('type') as ActivityType | 'all' | null) ?? undefined;

    const userExists = await checkUserExists(userId);
    if (!userExists) {
      return notFoundResponse('사용자를 찾을 수 없습니다', requestId);
    }

    const response = await getUserActivity({
      userId,
      type: typeFilter,
      cursor,
      limit,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Admin user activity fetch error', requestId);
  }
}
