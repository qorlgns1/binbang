import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { getMonitoringSummary } from '@/services/admin/monitoring.service';

export async function GET(): Promise<Response> {
  const requestId = createRequestId('admin_monitoring_summary');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const summary = await getMonitoringSummary();

    return NextResponse.json(summary);
  } catch (error) {
    return handleServiceError(error, 'Monitoring summary error', requestId);
  }
}
