import { NextResponse } from 'next/server';

import type { Platform, SelectorCategory } from '@workspace/db/enums';
import { requireAdmin } from '@/lib/admin';
import { badRequestResponse, handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { createSelector, getSelectors } from '@/services/admin/selectors.service';
import type { CreateSelectorPayload } from '@/types/admin';

// GET /api/admin/selectors
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;
  const category = searchParams.get('category') as SelectorCategory | null;
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const response = await getSelectors({ platform, category, includeInactive });

  return NextResponse.json(response);
}

// POST /api/admin/selectors
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as CreateSelectorPayload;

  // 필수 필드 검증
  if (!body.platform || !body.category || !body.name || !body.selector) {
    return badRequestResponse('Missing required fields');
  }

  try {
    const selector = await createSelector({
      ...body,
      createdById: session.user.id,
    });

    return NextResponse.json({ selector });
  } catch (error) {
    return handleServiceError(error, 'Admin selector create error');
  }
}
