import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { prisma } from '@workspace/db';

import { authOptions } from '@/lib/auth';

export interface HeartbeatHistoryItem {
  id: number;
  timestamp: Date;
  status: 'healthy' | 'unhealthy' | 'processing';
  isProcessing: boolean;
  uptime?: number | null;
  workerId: string;
}

async function getHeartbeatHistory(hours: number = 24): Promise<HeartbeatHistoryItem[]> {
  try {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return (await prisma.heartbeatHistory.findMany({
      where: {
        timestamp: {
          gte: since,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })) as HeartbeatHistoryItem[];
  } catch (error) {
    console.error('Heartbeat history fetch failed:', error);
    return [];
  }
}

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
