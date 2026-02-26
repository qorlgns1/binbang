import { NextResponse } from 'next/server';

import { pollAccommodationOnce } from '@/services/agoda-polling.service';

function authorizeInternalRequest(req: Request): { ok: boolean; message?: string; status?: number } {
  const token = process.env.MOONCATCH_INTERNAL_API_TOKEN?.trim();

  if (!token) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 503, message: 'MOONCATCH_INTERNAL_API_TOKEN is not configured' };
    }
    return { ok: true };
  }

  const provided = req.headers.get('x-mooncatch-internal-token')?.trim();
  if (!provided || provided !== token) {
    return { ok: false, status: 401, message: 'invalid internal token' };
  }

  return { ok: true };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const auth = authorizeInternalRequest(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: auth.message ?? 'unauthorized' } },
      { status: auth.status ?? 401 },
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'accommodation id is required' } },
      { status: 400 },
    );
  }

  try {
    const result = await pollAccommodationOnce(id);
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
