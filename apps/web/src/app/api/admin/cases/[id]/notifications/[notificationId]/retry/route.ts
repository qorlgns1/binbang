import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { retryNotification } from '@/services/notifications.service';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; notificationId: string }> },
): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { notificationId } = await params;
    const result = await retryNotification(notificationId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notification retry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
