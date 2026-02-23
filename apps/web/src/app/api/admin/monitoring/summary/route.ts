import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { getMonitoringSummary } from '@/services/admin/monitoring.service';

export async function GET(): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const summary = await getMonitoringSummary();

    return NextResponse.json(summary);
  } catch (error) {
    return handleServiceError(error, 'Monitoring summary error');
  }
}
