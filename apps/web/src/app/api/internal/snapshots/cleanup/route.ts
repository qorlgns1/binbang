import { NextResponse } from 'next/server';

import { cleanupExpiredAgodaPollRuns } from '@/services/agoda-snapshot-cleanup.service';
import { getBinbangRuntimeSettings } from '@/services/binbang-runtime-settings.service';

function authorizeInternalRequest(req: Request): { ok: boolean; message?: string; status?: number } {
  const internalToken = process.env.BINBANG_INTERNAL_API_TOKEN?.trim();
  if (!internalToken) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, status: 503, message: 'BINBANG_INTERNAL_API_TOKEN is not configured' };
    }
    return { ok: true };
  }

  const provided = req.headers.get('x-binbang-internal-token')?.trim();
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

  const runtimeSettings = await getBinbangRuntimeSettings();
  const retentionDays = runtimeSettings.snapshotRetentionDays;
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
