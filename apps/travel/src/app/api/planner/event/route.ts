import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { badRequestResponse, handleServiceError } from '@/lib/handleServiceError';
import { PLANNER_EVENT_NAMES } from '@/lib/plannerTracking';
import { createPlannerEvent } from '@/services/planner-event.service';

const utcIsoSchema = z
  .string()
  .datetime({ offset: true })
  .refine((value): boolean => value.endsWith('Z'), {
    message: 'UTC ISO string must end with Z',
  });

const bodySchema = z.object({
  eventName: z.enum(PLANNER_EVENT_NAMES),
  source: z.string().max(64).optional(),
  sessionId: z.string().max(128).optional(),
  locale: z.string().max(16).optional(),
  path: z.string().max(512).optional(),
  occurredAt: utcIsoSchema.optional(),
});

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse('Invalid request payload');
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.some((issue): boolean => issue.path[0] === 'eventName')
      ? 'eventName is required'
      : 'Invalid request payload';
    return badRequestResponse(message);
  }

  try {
    const referrer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() ?? null;
    const data = await createPlannerEvent({
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

    return NextResponse.json(
      {
        ok: true,
        data,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleServiceError(error, '[planner/event]');
  }
}
