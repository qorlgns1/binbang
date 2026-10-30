import { NextResponse } from 'next/server';

import { authorizeInternalRequest } from '@/lib/internalAuth';
import { createRequestId, logError, logInfo } from '@/lib/logger';
import { runNotificationSelfTest } from '@/services/notification-self-test.service';

// 배포 직후 deploy.yml이 호출한다. 실패하면 500을 돌려 배포를 실패로 표시한다.
export async function POST(req: Request): Promise<Response> {
  const requestId = createRequestId('selftest');
  const auth = authorizeInternalRequest(req);
  if (!auth.ok) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: auth.message ?? 'unauthorized', requestId } },
      { status: auth.status ?? 401 },
    );
  }

  try {
    const result = await runNotificationSelfTest();
    if (result.status === 'failed') {
      logError('notification_self_test_failed', { requestId, ...result });
      return NextResponse.json({ ok: false, requestId, result }, { status: 500 });
    }

    logInfo('notification_self_test_finished', { requestId, ...result });
    return NextResponse.json({ ok: true, requestId, result });
  } catch (error) {
    logError('notification_self_test_route_failed', { requestId, error });
    return NextResponse.json(
      {
        error: {
          code: 'SELF_TEST_FAILED',
          message: error instanceof Error ? error.message : 'self test failed',
          requestId,
        },
      },
      { status: 500 },
    );
  }
}
