import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { AwinConfigError, generateAwinLink } from '@/services/admin/awin.service';

const linkBuilderSchema = z.object({
  advertiserId: z.number().int().positive(),
  destinationUrl: z.string().url().optional(),
  clickref: z.string().optional(),
  shorten: z.boolean().optional(),
});

/** POST: Awin 추적 링크 생성 */
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse('Invalid JSON body');
  }

  const parsed = linkBuilderSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const result = await generateAwinLink(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return badRequestResponse(err.message);
    }
    return handleServiceError(err, 'Awin linkbuilder error');
  }
}
