import { NextResponse } from 'next/server';

import { authorizeInternalRequest } from '@/lib/internalAuth';
import { createRequestId, logError } from '@/lib/logger';
import { checkMissingAgodaNotifications } from '@/services/agoda-notification-watchdog.service';

export async function POST(req: Request): Promise<Response> {
  const requestId = createRequestId('watchdog');
  const auth = authorizeInternalRequest(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: auth.message ?? 'unauthorized', requestId } },
      { status: auth.status ?? 401 },
    );
  }

  try {
    const result = await checkMissingAgodaNotifications();
    return NextResponse.json({ ok: true, requestId, result });
  } catch (error) {
    logError('agoda_notification_watchdog_route_failed', { requestId, error });
    return NextResponse.json(
      {
        error: {
          code: 'WATCHDOG_FAILED',
          message: error instanceof Error ? error.message : 'watchdog failed',
          requestId,
        },
      },
      { status: 500 },
    );
  }
}
