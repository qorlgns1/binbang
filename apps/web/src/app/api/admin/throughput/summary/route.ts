import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { handleServiceError, unauthorizedResponse, validationErrorResponse } from '@/lib/handleServiceError';
import { getThroughputSummary } from '@/services/admin/throughput.service';

const paramsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function GET(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = paramsSchema.safeParse(params);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.issues);
    }

    const response = await getThroughputSummary({
      from: parsed.data.from,
      to: parsed.data.to,
    });

    return NextResponse.json(response);
  } catch (error) {
    return handleServiceError(error, 'Throughput summary error');
  }
}
