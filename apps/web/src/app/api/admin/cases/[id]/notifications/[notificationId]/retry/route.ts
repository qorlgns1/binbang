import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { createRequestId, logError, logInfo, logWarn } from '@/lib/logger';
import { retryNotificationForCase } from '@/services/notifications.service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; notificationId: string }> },
): Promise<Response> {
  const requestId = createRequestId('case_retry');
  try {
    const session = await requireAdmin();
    if (!session) {
      logWarn('case_notification_retry_route_unauthorized', { requestId });
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized', requestId } },
        { status: 401 },
      );
    }

    const { id: caseId, notificationId } = await params;
    const result = await retryNotificationForCase(notificationId, caseId, { requestId });

    if (!result.success) {
      logWarn('case_notification_retry_route_rejected', {
        requestId,
        caseId,
        notificationId,
        error: result.error ?? 'Retry failed',
      });
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: result.error ?? 'Retry failed', requestId } },
        { status: 400 },
      );
    }

    logInfo('case_notification_retry_route_success', {
      requestId,
      caseId,
      notificationId,
    });
    return NextResponse.json({ success: true, requestId });
  } catch (error) {
    logError('case_notification_retry_route_failed', {
      requestId,
      error,
    });
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error', requestId } },
      { status: 500 },
    );
  }
}
