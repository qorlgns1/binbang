import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { backfillPrices } from '@/services/admin/backfillService';

export async function POST(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await backfillPrices();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Price backfill error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
