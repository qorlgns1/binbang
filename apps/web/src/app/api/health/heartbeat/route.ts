import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { getHeartbeatStatus } from '@/services/health.service';

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles || !session.user.roles.includes('ADMIN')) {
    return unauthorizedResponse();
  }

  try {
    const heartbeat = await getHeartbeatStatus();

    return NextResponse.json(heartbeat);
  } catch (error) {
    return handleServiceError(error, 'Health heartbeat error');
  }
}
