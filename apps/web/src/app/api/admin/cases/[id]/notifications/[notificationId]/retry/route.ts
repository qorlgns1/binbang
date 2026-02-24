import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { badRequestResponse, handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { retryNotificationForCase } from '@/services/notifications.service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; notificationId: string }> },
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { id: caseId, notificationId } = await params;
    const result = await retryNotificationForCase(notificationId, caseId);

    if (!result.success) {
      return badRequestResponse(result.error ?? 'Retry failed');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleServiceError(error, 'Admin notification retry error');
  }
}
