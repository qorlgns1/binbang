import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { getHeartbeatHistory } from '@/services/heartbeat.service';

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles || !session.user.roles.includes('ADMIN')) {
    return unauthorizedResponse();
  }

  try {
    const history = await getHeartbeatHistory(24);
    return NextResponse.json(history);
  } catch (error) {
    return handleServiceError(error, 'Heartbeat history error');
  }
}
