import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { getThroughputHistory } from '@/services/admin/throughput.service';

const paramsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  bucketMinutes: z.coerce.number().min(1).max(1440).optional(),
});

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = createRequestId('admin_throughput_history');
  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = paramsSchema.safeParse(params);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues, requestId);
    }

    const response = await getThroughputHistory({
      from: parsed.data.from,
      to: parsed.data.to,
      bucketMinutes: parsed.data.bucketMinutes,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Throughput history error', requestId);
  }
}
