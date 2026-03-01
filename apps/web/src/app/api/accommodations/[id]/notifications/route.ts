import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { unauthorizedResponse } from '@/lib/handleServiceError';
import { getNotificationHistory } from '@/services/agoda-notification-history.service';
import type { RouteParams } from '@/types/api';

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<Response> {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  const notifications = await getNotificationHistory({
    accommodationId: id,
    userId: session.user.id,
  });

  return NextResponse.json({ notifications });
}
