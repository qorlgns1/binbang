import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { getFormSubmissions } from '@/services/intake.service';

export async function GET(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '20', 10), 1), 100);
    const status = searchParams.get('status') ?? undefined;

    const response = await getFormSubmissions({
      cursor,
      limit,
      ...(status && { status: status as Parameters<typeof getFormSubmissions>[0]['status'] }),
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Admin submissions fetch error');
  }
}
