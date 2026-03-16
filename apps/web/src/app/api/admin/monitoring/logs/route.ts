import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { getMonitoringLogs } from '@/services/admin/monitoring.service';

const logsParamsSchema = z.object({
  status: z.enum(['AVAILABLE', 'UNAVAILABLE', 'ERROR', 'UNKNOWN']).optional(),
  platform: z.enum(['AIRBNB', 'AGODA']).optional(),
  accommodationId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
});

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = createRequestId('admin_monitoring_logs');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = logsParamsSchema.safeParse(params);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const response = await getMonitoringLogs({
      status: parsed.data.status,
      platform: parsed.data.platform,
      accommodationId: parsed.data.accommodationId,
      from: parsed.data.from,
      to: parsed.data.to,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Monitoring logs error', requestId);
  }
}
