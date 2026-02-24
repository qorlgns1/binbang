import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { handleServiceError, unauthorizedResponse } from '@/lib/handleServiceError';
import { getRecentLogs } from '@/services/logs.service';

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return unauthorizedResponse();
  }

  try {
    const result = await getRecentLogs(session.user.id, 10);

    return NextResponse.json(result.logs);
  } catch (error) {
    return handleServiceError(error, 'Recent logs fetch error');
  }
}
