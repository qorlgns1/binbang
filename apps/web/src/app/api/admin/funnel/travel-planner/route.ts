import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { createRequestId, logInfo } from '@/lib/logger';
import { getAdminTravelPlannerFunnel } from '@/services/admin/travel-planner-funnel.service';

export async function GET(): Promise<Response> {
  const requestId = createRequestId('admin_funnel_travel_planner');
  const startedAt = Date.now();

  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const data = await getAdminTravelPlannerFunnel();
    const latencyMs = Date.now() - startedAt;

    logInfo('admin_funnel_travel_planner_route_success', {
      requestId,
      range: '7d',
      source: 'travel-planner',
      latencyMs,
    });

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    return handleServiceError(error, '[admin/funnel/travel-planner]', requestId);
  }
}
