import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError } from '@/lib/handleServiceError';
import { listAffiliateAdvertisers } from '@/services/admin/affiliate-advertiser.service';

const categorySchema = z.enum(['accommodation', 'flight', 'esim', 'car_rental', 'travel_package', 'other']).optional();

/** GET: DB에 저장된 가입 광고주 목록 (category 필터 선택) */
export async function GET(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = categorySchema.safeParse(searchParams.get('category') || undefined);
  const category = parsed.success ? parsed.data : undefined;

  try {
    const list = await listAffiliateAdvertisers(category);
    return NextResponse.json(list);
  } catch (error) {
    return handleServiceError(error, 'Affiliate advertisers GET error');
  }
}
