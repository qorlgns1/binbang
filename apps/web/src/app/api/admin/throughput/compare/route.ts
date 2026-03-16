import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { createRequestId } from '@/lib/logger';
import { getThroughputCompare } from '@/services/admin/throughput.service';

const paramsSchema = z.object({
  compareBy: z.enum(['concurrency', 'browserPoolSize']),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = createRequestId('admin_throughput_compare');
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

    const response = await getThroughputCompare({
      compareBy: parsed.data.compareBy,
      from: parsed.data.from,
      to: parsed.data.to,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Throughput compare error', requestId);
  }
}
