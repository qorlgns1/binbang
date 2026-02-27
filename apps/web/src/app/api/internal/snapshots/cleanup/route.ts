import { NextResponse } from 'next/server';

import { cleanupExpiredAgodaPollRuns } from '@/services/agoda-snapshot-cleanup.service';

const DEFAULT_RETENTION_DAYS = 30;

function authorizeInternalRequest(req: Request): { ok: boolean; message?: string; status?: number } {
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

function resolveRetentionDays(): number {
  const raw = process.env.MOONCATCH_SNAPSHOT_RETENTION_DAYS;
  if (!raw) return DEFAULT_RETENTION_DAYS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_RETENTION_DAYS;
  return parsed;
}

export async function POST(req: Request): Promise<Response> {
  const auth = authorizeInternalRequest(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: auth.message ?? 'unauthorized' } },
      { status: auth.status ?? 401 },
    );
  }

  const retentionDays = resolveRetentionDays();
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  try {
    const result = await cleanupExpiredAgodaPollRuns({ cutoff });

    return NextResponse.json({
      ok: true,
      result: {
        deletedPollRuns: result.deletedPollRuns,
        retentionDays,
        cutoff: cutoff.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: { code: 'CLEANUP_FAILED', message: error.message } }, { status: 500 });
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'cleanup execution failed' } },
      { status: 500 },
    );
  }
}
