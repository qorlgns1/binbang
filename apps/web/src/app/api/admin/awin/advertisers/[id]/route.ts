import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import {
  type AffiliateAdvertiserCategory,
  updateAffiliateAdvertiser,
} from '@/services/admin/affiliate-advertiser.service';

const CATEGORIES: AffiliateAdvertiserCategory[] = [
  'accommodation',
  'flight',
  'esim',
  'car_rental',
  'travel_package',
  'other',
];

/** PATCH: 카테고리/메모 수정 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  let body: { category?: string; notes?: string | null } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const category =
    body.category && CATEGORIES.includes(body.category as AffiliateAdvertiserCategory)
      ? (body.category as AffiliateAdvertiserCategory)
      : undefined;
  const item = await updateAffiliateAdvertiser(id, {
    ...(category !== undefined && { category }),
    ...(body.notes !== undefined && { notes: body.notes ?? null }),
  });
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(item);
}
