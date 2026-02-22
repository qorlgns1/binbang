import { NextResponse } from 'next/server';

import { z } from 'zod';

import type { Platform, SelectorCategory } from '@workspace/db/enums';
import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { createSelector, getSelectors } from '@/services/admin/selectors.service';

const createSelectorSchema = z.object({
  platform: z.enum(['AIRBNB', 'AGODA']),
  category: z.enum(['PRICE', 'AVAILABILITY', 'METADATA', 'PLATFORM_ID']),
  name: z.string().min(1, '이름을 입력해주세요'),
  selector: z.string().min(1, 'CSS 셀렉터를 입력해주세요'),
  extractorCode: z.string().optional(),
  priority: z.number().int().optional(),
  description: z.string().optional(),
});

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse('Invalid JSON');
  }

  const parsed = createSelectorSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const selector = await createSelector({
      ...parsed.data,
      createdById: session.user.id,
    });

    return NextResponse.json({ selector });
  } catch (error) {
    return handleServiceError(error, 'Admin selector create error');
  }
}
