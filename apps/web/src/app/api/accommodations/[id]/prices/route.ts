import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { getAccommodationPriceHistory } from '@/services/accommodationsService';
import type { RouteParams } from '@/types/api';

export async function GET(request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}
