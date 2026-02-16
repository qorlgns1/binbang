import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';

const payloadSchema = z.object({
  windowDays: z.number().int().min(1).max(180).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rawBody = (await request.json().catch((): Record<string, unknown> => ({}))) as Record<string, unknown>;
  const parsed = payloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.errors }, { status: 400 });
  }

  const workerUrl = process.env.WORKER_INTERNAL_URL || 'http://localhost:3500';

  try {
    const workerRes = await fetch(`${workerUrl}/public-availability-snapshot/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(7000),
    });

    if (!workerRes.ok) {
      const workerError = await workerRes.text().catch((): string => '');
      return NextResponse.json(
        {
          error: workerError || '워커에 스냅샷 실행 요청을 전달하지 못했습니다.',
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    const data = await workerRes.json().catch((): Record<string, unknown> => ({}));
    return NextResponse.json(data, { status: 202 });
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
