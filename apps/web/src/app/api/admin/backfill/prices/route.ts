import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { backfillPrices } from '@/services/admin/backfill.service';

export async function POST(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const result = await backfillPrices();
    return NextResponse.json(result);
  } catch (error) {
    return handleServiceError(error, 'Price backfill error');
  }
}
