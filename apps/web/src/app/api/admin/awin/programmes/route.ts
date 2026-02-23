import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { AwinConfigError, listAwinProgrammes } from '@/services/admin/awin.service';

const programmesSchema = z.object({
  relationship: z.enum(['joined', 'pending', 'suspended', 'rejected', 'notjoined']).default('joined'),
  countryCode: z.string().length(2).optional(),
});

/** GET: Awin 프로그램(광고주) 목록 조회 */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const parsed = programmesSchema.safeParse({
    relationship: searchParams.get('relationship') ?? undefined,
    countryCode: searchParams.get('countryCode')?.trim() || undefined,
  });
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const result = await listAwinProgrammes(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return badRequestResponse(err.message);
    }
    return handleServiceError(err, 'Awin programmes error');
  }
}
