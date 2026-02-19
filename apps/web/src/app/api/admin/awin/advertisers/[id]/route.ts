import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { updateAffiliateAdvertiser } from '@/services/admin/affiliate-advertiser.service';

const patchSchema = z.object({
  category: z.enum(['accommodation', 'flight', 'esim', 'car_rental', 'travel_package', 'other']).optional(),
  notes: z.string().nullable().optional(),
});

/** PATCH: 카테고리/메모 수정 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
  }
  if (parsed.data.category === undefined && parsed.data.notes === undefined) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const item = await updateAffiliateAdvertiser(id, {
    ...(parsed.data.category !== undefined && { category: parsed.data.category }),
    ...(parsed.data.notes !== undefined && { notes: parsed.data.notes ?? null }),
  });

  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(item);
}
