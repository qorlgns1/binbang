import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import {
  type AffiliateAdvertiserCategory,
  listAffiliateAdvertisers,
} from '@/services/admin/affiliate-advertiser.service';

const CATEGORIES: AffiliateAdvertiserCategory[] = [
  'accommodation',
  'flight',
  'esim',
  'car_rental',
  'travel_package',
  'other',
];

/** GET: DB에 저장된 가입 광고주 목록 (category 필터 선택) */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get('category');
  const category = categoryParam && CATEGORIES.includes(categoryParam as AffiliateAdvertiserCategory)
    ? (categoryParam as AffiliateAdvertiserCategory)
    : undefined;
  try {
    const list = await listAffiliateAdvertisers(category);
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'List failed' },
      { status: 500 },
    );
  }
}
