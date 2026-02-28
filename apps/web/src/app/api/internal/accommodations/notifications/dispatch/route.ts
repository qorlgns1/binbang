import { NextResponse } from 'next/server';

import { authorizeInternalRequest } from '@/lib/internalAuth';
import { dispatchAgodaNotifications } from '@/services/agoda-notification.service';

export async function POST(req: Request): Promise<Response> {
  const auth = authorizeInternalRequest(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: auth.message ?? 'unauthorized' } },
      { status: auth.status ?? 401 },
    );
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const payload = (body ?? {}) as { limit?: number };

  try {
    const result = await dispatchAgodaNotifications({
      limit: typeof payload.limit === 'number' ? payload.limit : undefined,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: { code: 'DISPATCH_FAILED', message: error.message } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'dispatch failed' } }, { status: 500 });
  }
}
