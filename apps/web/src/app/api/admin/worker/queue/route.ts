import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';

const DEFAULT_LIMIT = 20;

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: NextRequest): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.issues }, { status: 400 });
  }

  const limit = parsed.data.limit ?? DEFAULT_LIMIT;
  const workerUrl = process.env.WORKER_INTERNAL_URL || 'http://localhost:3500';

  try {
    const workerRes = await fetch(`${workerUrl}/queue/snapshot?limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!workerRes.ok) {
      const workerError = await workerRes.text().catch((): string => '');
      return NextResponse.json(
        {
          error: workerError || '워커 큐 스냅샷을 가져오지 못했습니다.',
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    const data = await workerRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        error: '워커가 실행 중이지 않거나 응답이 지연되고 있습니다.',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
