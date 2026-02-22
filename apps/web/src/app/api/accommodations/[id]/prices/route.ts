import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { getAccommodationPriceHistory } from '@/services/accommodations.service';
import type { RouteParams } from '@/types/api';

export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;

    const result = await getAccommodationPriceHistory({
      accommodationId: id,
      userId: session.user.id,
      from,
      to,
    });

    if (!result) {
      return notFoundResponse();
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error, 'Accommodation price history fetch error');
  }
}
