import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { LANDING_CLICK_EVENT_NAMES } from '@/lib/analytics/click-event-names';
import { createLandingClickEvent } from '@/services/analytics-click.service';

const utcIsoSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value): boolean => value.endsWith('Z'), {
    message: 'UTC ISO string must end with Z',
  });

const bodySchema = z.object({
  eventName: z.enum(LANDING_CLICK_EVENT_NAMES),
  source: z.string().max(64).optional(),
  sessionId: z.string().max(128).optional(),
  locale: z.string().max(16).optional(),
  path: z.string().max(512).optional(),
  occurredAt: utcIsoSchema.optional(),
});

type ErrorCode = 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR';

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

export async function POST(request: NextRequest): Promise<Response> {
  const requestId = makeRequestId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'BAD_REQUEST', 'Invalid request payload', requestId);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.some((issue): boolean => issue.path[0] === 'eventName')
      ? 'eventName is required'
      : 'Invalid request payload';
    return errorResponse(400, 'BAD_REQUEST', message, requestId);
  }

  try {
    const referrer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? null;
    const data = await createLandingClickEvent({
      eventName: parsed.data.eventName,
      source: parsed.data.source,
      sessionId: parsed.data.sessionId,
      locale: parsed.data.locale,
      path: parsed.data.path,
      occurredAt: parsed.data.occurredAt,
      referrer,
      userAgent,
      ipAddress,
    });

    console.info('[analytics/click] success', {
      requestId,
      eventName: data.eventName,
      referrer: referrer ?? null,
      userAgent: userAgent ?? null,
    });

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[analytics/click] error', { requestId, error });
    return errorResponse(500, 'INTERNAL_SERVER_ERROR', 'Internal server error', requestId);
  }
}
