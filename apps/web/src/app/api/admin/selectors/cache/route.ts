import { NextResponse } from 'next/server';

import type { Platform } from '@workspace/db/enums';
import { requireAdmin } from '@/lib/admin';
import { invalidateSelectorCache } from '@/services/selectors.service';

interface InvalidateCachePayload {
  platform?: Platform;
}

// POST /api/admin/selectors/cache
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as InvalidateCachePayload;

  // 1. API 서버의 캐시 무효화
  const invalidatedPlatforms = invalidateSelectorCache(body.platform);

  // 2. 워커의 캐시 무효화
  let workerResult = null;
  try {
    const workerUrl = process.env.WORKER_INTERNAL_URL || 'http://localhost:3500';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const secret = process.env.WORKER_INTERNAL_SECRET;
    if (typeof secret === 'string' && secret.length > 0) headers['X-Worker-Secret'] = secret;
    const workerRes = await fetch(`${workerUrl}/cache/invalidate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ platform: body.platform }),
      signal: AbortSignal.timeout(5000),
    });

    if (workerRes.ok) {
      workerResult = await workerRes.json();
    }
  } catch {
    // 워커 연결 실패는 무시 (워커가 실행 중이지 않을 수 있음)
  }

  return NextResponse.json({
    success: true,
    invalidatedPlatforms,
    workerCacheInvalidated: workerResult !== null,
    workerResult,
  });
}
