import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { AwinConfigError, getAwinProgrammeDetails } from '@/services/admin/awin.service';

const detailsSchema = z.object({
  advertiserId: z.number().int().positive(),
  relationship: z.enum(['joined', 'pending', 'notjoined']).default('joined'),
});

/** GET: Awin 특정 광고주(프로그램) 상세 정보 */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const advertiserIdRaw = searchParams.get('advertiserId')?.trim();
  const parsed = detailsSchema.safeParse({
    advertiserId: advertiserIdRaw ? Number.parseInt(advertiserIdRaw, 10) : undefined,
    relationship: searchParams.get('relationship') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await getAwinProgrammeDetails(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: 'Request failed', detail: message }, { status: 500 });
  }
}
