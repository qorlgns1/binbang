import { NextResponse } from 'next/server';

import { z } from 'zod';

import type { PatternType, Platform } from '@workspace/db/enums';
import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { createPattern, getPatterns } from '@/services/admin/patterns.service';

const createPatternSchema = z.object({
  platform: z.enum(['AIRBNB', 'AGODA']),
  patternType: z.enum(['AVAILABLE', 'UNAVAILABLE']),
  pattern: z.string().min(1, '패턴 텍스트를 입력해주세요'),
  locale: z.string().min(1).optional(),
  priority: z.number().int().optional(),
});

// GET /api/admin/patterns
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;
  const patternType = searchParams.get('patternType') as PatternType | null;
  const includeInactive = searchParams.get('includeInactive') === 'true';

  const response = await getPatterns({ platform, patternType, includeInactive });

  return NextResponse.json(response);
}

// POST /api/admin/patterns
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

  const parsed = createPatternSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const pattern = await createPattern({
      ...parsed.data,
      createdById: session.user.id,
    });

    return NextResponse.json({ pattern });
  } catch (error) {
    return handleServiceError(error, 'Admin pattern create error');
  }
}
