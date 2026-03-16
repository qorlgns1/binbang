import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AffiliateAdvertiserCategory } from '@workspace/db/enums';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';
import { badRequestResponse, handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { createRequestId, logInfo } from '@/lib/logger';
import { getAdminAffiliateFunnel } from '@/services/admin/affiliate-funnel.service';
import type { FunnelRangePreset } from '@/services/admin/funnel.service';

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
    category: z.nativeEnum(AffiliateAdvertiserCategory).optional(),
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

export async function GET(request: NextRequest): Promise<Response> {
  const requestId = createRequestId('admin_funnel_affiliate');
  const startedAt = Date.now();

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return badRequestResponse('Invalid request payload', undefined, requestId);
  }

  try {
    const session = await requireAdmin();
    if (!session) {
      return unauthorizedResponse('Unauthorized', requestId);
    }

    const range: FunnelRangePreset | undefined = parsed.data.range;
    const data = await getAdminAffiliateFunnel({
      range,
      from: parsed.data.from,
      to: parsed.data.to,
      category: parsed.data.category,
    });

    const latencyMs = Date.now() - startedAt;
    logInfo('admin_funnel_affiliate_route_success', {
      requestId,
      range: range ?? '30d',
      category: parsed.data.category ?? 'all',
      from: parsed.data.from ?? null,
      to: parsed.data.to ?? null,
      latencyMs,
    });

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    return handleServiceError(error, '[admin/funnel/affiliate]', requestId);
  }
}
