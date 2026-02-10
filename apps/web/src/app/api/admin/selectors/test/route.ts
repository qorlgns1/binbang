import { NextResponse } from 'next/server';

import type { Platform } from '@workspace/db/enums';
import { requireAdmin } from '@/lib/admin';

interface TestSelectorPayload {
  url: string;
  checkIn: string;
  checkOut: string;
  adults: number;
}

function detectPlatform(url: string): Platform | null {
  if (url.includes('airbnb')) return 'AIRBNB';
  if (url.includes('agoda')) return 'AGODA';
  return null;
}

// POST /api/admin/selectors/test
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as TestSelectorPayload;
  const { url, checkIn, checkOut, adults } = body;

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    // 워커 내부 HTTP 서버로 테스트 요청 전달
    const workerUrl = process.env.WORKER_INTERNAL_URL || 'http://localhost:3500';

    const workerRes = await fetch(`${workerUrl}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        platform,
        checkIn,
        checkOut,
        adults,
      }),
      signal: AbortSignal.timeout(60000), // 60초 타임아웃
    });

    if (!workerRes.ok) {
      const error = await workerRes.text();
      return NextResponse.json(
        {
          success: false,
          platform,
          url,
          error: `Worker error: ${error}`,
          durationMs: Date.now() - startTime,
        },
        { status: 500 },
      );
    }

    const workerResult = await workerRes.json();

    return NextResponse.json({
      success: true,
      platform,
      url,
      result: {
        available: workerResult.available,
        price: workerResult.price,
        reason: workerResult.error || workerResult.reason || null,
        metadata: workerResult.metadata,
      },
      matchedSelectors: workerResult.matchedSelectors || [],
      matchedPatterns: workerResult.matchedPatterns || [],
      testableElements: workerResult.testableElements || [],
      durationMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 워커 연결 실패 시 안내 메시지
    if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          success: false,
          platform,
          url,
          error: '워커가 실행 중이지 않습니다. 로컬에서 pnpm cron을 실행하거나 프로덕션 워커를 확인하세요.',
          durationMs: Date.now() - startTime,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        platform,
        url,
        error: errorMessage,
        durationMs: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}
