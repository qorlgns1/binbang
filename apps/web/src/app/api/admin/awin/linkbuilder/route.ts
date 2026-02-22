import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = linkBuilderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  try {
    const result = await generateAwinLink(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AwinConfigError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: 'Request failed', detail: message }, { status: 500 });
  }
}
