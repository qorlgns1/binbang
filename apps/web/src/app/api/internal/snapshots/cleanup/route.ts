import { NextResponse } from 'next/server';

import { authorizeInternalRequest } from '@/lib/internalAuth';
import { cleanupExpiredAgodaPollRuns } from '@/services/agoda-snapshot-cleanup.service';
import { getBinbangRuntimeSettings } from '@/services/binbang-runtime-settings.service';

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

  if (retentionDays <= 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_CONFIG', message: `snapshotRetentionDays must be > 0, got ${retentionDays}` } },
      { status: 400 },
    );
  }

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
