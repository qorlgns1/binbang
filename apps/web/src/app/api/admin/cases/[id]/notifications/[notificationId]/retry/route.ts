import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { retryNotificationForCase } from '@/services/notificationsService';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; notificationId: string }> },
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: caseId, notificationId } = await params;
    const result = await retryNotificationForCase(notificationId, caseId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notification retry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
