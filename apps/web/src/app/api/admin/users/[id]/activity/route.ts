import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { checkUserExists, getUserActivity } from '@/services/admin/usersService';
import type { ActivityType } from '@/types/activity';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10), 1), 100);
    const typeFilter = (searchParams.get('type') as ActivityType | 'all' | null) ?? undefined;

    const userExists = await checkUserExists(userId);
    if (!userExists) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const response = await getUserActivity({
      userId,
      type: typeFilter,
      cursor,
      limit,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin user activity fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
