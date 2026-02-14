import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { getAdminFunnel, type FunnelRangePreset } from '@/services/admin/funnel.service';

const paramsSchema = z.object({
  range: z.enum(['today', '7d', '30d', 'all']).optional(),
});

type ErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'INTERNAL_SERVER_ERROR';

function makeRequestId(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  const entropy = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `req_${timestamp}_${entropy}`;
}

function errorResponse(status: number, code: ErrorCode, message: string, requestId: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId,
      },
    },
    { status },
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = makeRequestId();
  const startedAt = Date.now();

  const session = await requireAdmin();
  if (!session) {
    return errorResponse(401, 'UNAUTHORIZED', 'Unauthorized', requestId);
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    return errorResponse(400, 'BAD_REQUEST', 'Invalid request payload', requestId);
  }

  try {
    const range: FunnelRangePreset | undefined = parsed.data.range;
    const data = await getAdminFunnel({ range });
    const latencyMs = Date.now() - startedAt;

    console.info('[admin/funnel] success', { requestId, range: range ?? '30d', latencyMs });

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    console.error('[admin/funnel] error', { requestId, latencyMs, error });
    return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Internal server error', requestId);
  }
}
