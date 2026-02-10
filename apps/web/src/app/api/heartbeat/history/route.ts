import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { getHeartbeatHistory } from '@/services/heartbeat.service';

/**
 * Handle GET requests for admin-only heartbeat history and return recent heartbeat records.
 *
 * @returns A NextResponse containing the heartbeat history as JSON for authorized ADMIN users; if the requester is not an ADMIN, a 401 JSON error `{ error: 'Unauthorized' }`; on server error, a 500 JSON object with `error` (the error message or `'Unknown error'`) and `timestamp` (ISO string).
 */
export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles || !session.user.roles.includes('ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const history = await getHeartbeatHistory(24);
    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}