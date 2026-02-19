import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // empty body is ok — defaults will apply
  }

  const parsed = offersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
  }

  try {
    const result = await listAwinOffers(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: 'Request failed', detail: message }, { status: 500 });
  }
}
