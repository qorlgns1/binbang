import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const DEFAULT_LIMIT = 20;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accommodation = await prisma.accommodation.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });

  if (!accommodation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const cursor = searchParams.get('cursor') ?? undefined;
  const limit = Math.min(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 50);

  const logs = await prisma.checkLog.findMany({
    where: { accommodationId: id },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ logs: items, nextCursor });
}
