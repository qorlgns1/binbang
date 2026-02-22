import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/handleServiceError';
import { AwinConfigError, listAwinOffers } from '@/services/admin/awin.service';

const offersSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(200).default(50),
  membership: z.enum(['joined', 'notJoined', 'all']).default('joined'),
  type: z.enum(['promotion', 'voucher', 'all']).default('all'),
  status: z.enum(['active', 'expiringSoon', 'upcoming']).default('active'),
});

/** POST: Awin 프로모션/바우처 목록 조회 */
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is ok — defaults will apply
  }

  const parsed = offersSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const result = await listAwinOffers(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return badRequestResponse(err.message);
    }
    return handleServiceError(err, 'Awin offers error');
  }
}
