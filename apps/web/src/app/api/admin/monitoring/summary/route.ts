import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { getMonitoringSummary } from '@/services/admin/monitoring.service';

export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await getMonitoringSummary();

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Monitoring summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
