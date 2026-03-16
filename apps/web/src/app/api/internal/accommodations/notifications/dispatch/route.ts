import { NextResponse } from 'next/server';

import { authorizeInternalRequest } from '@/lib/internalAuth';
import { createRequestId, logError } from '@/lib/logger';
import { dispatchAgodaNotifications } from '@/services/agoda-notification.service';

export async function POST(req: Request): Promise<Response> {
  const requestId = createRequestId('dispatch');
  const auth = authorizeInternalRequest(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: auth.message ?? 'unauthorized', requestId } },
      { status: auth.status ?? 401 },
    );
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const payload = (body ?? {}) as { limit?: unknown };
  const rawLimit = payload.limit;
  const limit = typeof rawLimit === 'number' && Number.isInteger(rawLimit) && rawLimit > 0 ? rawLimit : undefined;

  try {
    const result = await dispatchAgodaNotifications({ limit, requestId });
    return NextResponse.json({ ok: true, requestId, result });
  } catch (error) {
    logError('agoda_notification_dispatch_route_failed', {
      requestId,
      limit: limit ?? null,
      error,
    });
    if (error instanceof Error) {
      return NextResponse.json(
        { error: { code: 'DISPATCH_FAILED', message: error.message, requestId } },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'dispatch failed', requestId } },
      { status: 500 },
    );
  }
}
