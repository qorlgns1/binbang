import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { getAdminFunnelClicks } from '@/services/admin/funnelClicksService';
import type { FunnelRangePreset } from '@/services/admin/funnelService';

const utcIsoSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value): boolean => value.endsWith('Z'), {
    message: 'UTC ISO string must end with Z',
  });

const paramsSchema = z
  .object({
    range: z.enum(['today', '7d', '30d', 'all']).optional(),
    from: utcIsoSchema.optional(),
    to: utcIsoSchema.optional(),
  })
  .superRefine((value, ctx): void => {
    const from = value.from;
    const to = value.to;
    const hasFrom = typeof from === 'string';
    const hasTo = typeof to === 'string';

    if (hasFrom !== hasTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '`from` and `to` must be provided together',
      });
      return;
    }

    if (!hasFrom || !hasTo) return;

    if (new Date(from).getTime() > new Date(to).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '`from` must be less than or equal to `to`',
      });
    }
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
    const data = await getAdminFunnelClicks({
      range,
      from: parsed.data.from,
      to: parsed.data.to,
    });
    const latencyMs = Date.now() - startedAt;

    console.info('[admin/funnel/clicks] success', {
      requestId,
      range: range ?? '30d',
      from: parsed.data.from ?? null,
      to: parsed.data.to ?? null,
      latencyMs,
    });

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    console.error('[admin/funnel/clicks] error', { requestId, latencyMs, error });
    return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Internal server error', requestId);
  }
}
