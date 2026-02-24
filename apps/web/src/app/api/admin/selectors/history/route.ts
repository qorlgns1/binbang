import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { getSelectorHistory } from '@/services/admin/selectors.service';

export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as 'PlatformSelector' | 'PlatformPattern' | null;
    const entityId = searchParams.get('entityId') ?? undefined;
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

    const response = await getSelectorHistory({
      entityType: entityType ?? undefined,
      entityId,
      from,
      to,
      cursor,
      limit,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Selector history error');
  }
}
