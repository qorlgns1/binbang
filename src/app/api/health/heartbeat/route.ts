import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles || !session.user.roles.includes('ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const heartbeat = await prisma.workerHeartbeat.findUnique({
      where: { id: 'singleton' },
    });

    if (!heartbeat) {
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        isHealthy: false,
        workerStatus: 'stopped',
        lastHeartbeat: null,
        minutesSinceLastHeartbeat: -1,
        isProcessing: false,
        processingDuration: 0,
        alerts: ['워커 하트비트 기록 없음'],
      });
    }

    const now = new Date();
    const timeSinceLastHeartbeat = now.getTime() - new Date(heartbeat.lastHeartbeatAt).getTime();
    const minutesSinceLastHeartbeat = timeSinceLastHeartbeat / (1000 * 60);
    const intervalMs = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '60000');
    const missedBeats = Math.floor(timeSinceLastHeartbeat / intervalMs);
    const missedThreshold = parseInt(process.env.HEARTBEAT_MISSED_THRESHOLD || '1');

    const isHealthy = missedBeats < missedThreshold;
    const alerts = [];

    if (missedBeats >= missedThreshold) {
      alerts.push(`워커 응답 없음 (${missedBeats}회 놓침)`);
    }

    if (heartbeat.isProcessing) {
      const processingTime = now.getTime() - new Date(heartbeat.updatedAt).getTime();
      alerts.push(`워커 처리 중 (${Math.floor(processingTime / 60000)}분)`);
    }

    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      isHealthy,
      workerStatus: isHealthy ? 'running' : 'stopped',
      lastHeartbeat: heartbeat.lastHeartbeatAt,
      minutesSinceLastHeartbeat,
      isProcessing: heartbeat.isProcessing,
      processingDuration: heartbeat.isProcessing ? now.getTime() - new Date(heartbeat.updatedAt).getTime() : 0,
      alerts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
