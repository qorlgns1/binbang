import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { AwinConfigError, listAwinProgrammes } from '@/services/admin/awin.service';

const programmesSchema = z.object({
  relationship: z.enum(['joined', 'pending', 'suspended', 'rejected', 'notjoined']).default('joined'),
  countryCode: z.string().length(2).optional(),
});

/** GET: Awin 프로그램(광고주) 목록 조회 */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = programmesSchema.safeParse({
    relationship: searchParams.get('relationship') ?? undefined,
    countryCode: searchParams.get('countryCode')?.trim() || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
  }

  try {
    const result = await listAwinProgrammes(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: 'Request failed', detail: message }, { status: 500 });
  }
}
