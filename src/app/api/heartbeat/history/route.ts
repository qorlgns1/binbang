import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { getHeartbeatHistory } from '@/lib/heartbeat';

export async function GET() {
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
