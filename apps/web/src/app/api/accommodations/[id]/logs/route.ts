import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { getAccommodationLogs, verifyAccommodationOwnership } from '@/services/accommodations.service';
import type { RouteParams } from '@/types/api';

const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    const isOwner = await verifyAccommodationOwnership(id, session.user.id);

    if (!isOwner) {
      return notFoundResponse();
    }

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 50);

    const result = await getAccommodationLogs({
      accommodationId: id,
      cursor,
      limit,
    });

    return NextResponse.json({ logs: result.logs, nextCursor: result.nextCursor });
  } catch (error) {
    return handleServiceError(error, 'Accommodation logs fetch error');
  }
}
