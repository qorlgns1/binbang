import { NextResponse } from 'next/server';

import { pollDueAccommodationsOnce } from '@/services/agoda-polling.service';

function authorizeInternalRequest(req: Request): { ok: boolean; message?: string; status?: number } {
  // Vercel Cron 인증 (Authorization: Bearer <CRON_SECRET>)
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')?.trim();
    if (authHeader === `Bearer ${cronSecret}`) {
      return { ok: true };
    }
  }

  // 내부 토큰 인증
  const internalToken = process.env.MOONCATCH_INTERNAL_API_TOKEN?.trim();
  if (!internalToken) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 503, message: 'MOONCATCH_INTERNAL_API_TOKEN is not configured' };
    }
    return { ok: true };
  }

  const provided = req.headers.get('x-mooncatch-internal-token')?.trim();
  if (!provided || provided !== internalToken) {
    return { ok: false, status: 401, message: 'invalid internal token' };
  }

  return { ok: true };
}

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

  const payload = (body ?? {}) as { limit?: number; concurrency?: number };

  try {
    const result = await pollDueAccommodationsOnce({
      limit: typeof payload.limit === 'number' ? payload.limit : undefined,
      concurrency: typeof payload.concurrency === 'number' ? payload.concurrency : undefined,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: { code: 'POLL_FAILED', message: error.message } }, { status: 400 });
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'poll execution failed' } },
      { status: 500 },
    );
  }
}
