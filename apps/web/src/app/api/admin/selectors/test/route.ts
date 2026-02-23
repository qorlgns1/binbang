import { NextResponse } from 'next/server';

import type { Platform } from '@workspace/db/enums';
import { requireAdmin } from '@/lib/admin';
import {
  badRequestResponse,
  handleServiceError,
  serviceUnavailableResponse,
  unauthorizedResponse,
} from '@/lib/handleServiceError';

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
    return unauthorizedResponse();
  }

  let body: TestSelectorPayload;
  try {
    body = (await request.json()) as TestSelectorPayload;
  } catch {
    return badRequestResponse('Invalid JSON');
  }

  const { url, checkIn, checkOut, adults } = body;

  if (!url) {
    return badRequestResponse('URL is required');
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return badRequestResponse('Unsupported platform');
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
      const workerError = await workerRes.text().catch((): string => '');
      return serviceUnavailableResponse(
        workerError ? `Worker error: ${workerError}` : '워커에 셀렉터 테스트 요청을 전달하지 못했습니다.',
        {
          platform,
          url,
          durationMs: Date.now() - startTime,
        },
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
    if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      return serviceUnavailableResponse('워커가 실행 중이지 않거나 응답이 지연되고 있습니다.', {
        platform,
        url,
        durationMs: Date.now() - startTime,
        cause: errorMessage,
      });
    }

    if (errorMessage.includes('aborted')) {
      return serviceUnavailableResponse('워커 요청 시간이 초과되었습니다.', {
        platform,
        url,
        durationMs: Date.now() - startTime,
        cause: errorMessage,
      });
    }

    return handleServiceError(error, 'Admin selector test error');
  }
}
