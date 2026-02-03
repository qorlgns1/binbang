import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import prisma from '@/lib/prisma';
import { loadSettings } from '@/lib/settings';
import type { MonitoringSummary, WorkerHealthInfo } from '@/types/admin';

function getWorkerStatus(
  lastHeartbeatAt: Date | null,
  healthyMs: number,
  degradedMs: number,
): WorkerHealthInfo['status'] {
  if (!lastHeartbeatAt) return 'down';
  const elapsed = Date.now() - lastHeartbeatAt.getTime();
  if (elapsed < healthyMs) return 'healthy';
  if (elapsed < degradedMs) return 'degraded';
  return 'down';
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await loadSettings();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [heartbeat, dbLatency, checkStats24h, recentErrors, lastSuccess, activeCount] = await Promise.all([
      prisma.workerHeartbeat.findUnique({ where: { id: 'singleton' } }),

      (async () => {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        return Date.now() - start;
      })(),

      prisma.checkLog.groupBy({
        by: ['status'],
        where: { createdAt: { gte: oneDayAgo } },
        _count: { status: true },
      }),

      prisma.checkLog.findMany({
        where: { createdAt: { gte: oneHourAgo }, status: 'ERROR' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { errorMessage: true },
      }),

      prisma.checkLog.findFirst({
        where: { status: { in: ['AVAILABLE', 'UNAVAILABLE'] } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      prisma.accommodation.count({ where: { isActive: true } }),
    ]);

    const errorCount1h = await prisma.checkLog.count({
      where: { createdAt: { gte: oneHourAgo }, status: 'ERROR' },
    });

    const totalChecks = checkStats24h.reduce((sum, g) => sum + g._count.status, 0);
    const errorChecks = checkStats24h.filter((g) => g.status === 'ERROR').reduce((sum, g) => sum + g._count.status, 0);
    const successChecks = totalChecks - errorChecks;

    const summary: MonitoringSummary = {
      worker: {
        status: getWorkerStatus(
          heartbeat?.lastHeartbeatAt ?? null,
          settings.monitoring.workerHealthyThresholdMs,
          settings.monitoring.workerDegradedThresholdMs,
        ),
        startedAt: heartbeat?.startedAt?.toISOString() ?? null,
        lastHeartbeatAt: heartbeat?.lastHeartbeatAt?.toISOString() ?? null,
        isProcessing: heartbeat?.isProcessing ?? false,
        schedule: heartbeat?.schedule ?? null,
      },
      db: {
        connected: true,
        latencyMs: dbLatency,
      },
      checkRate24h: {
        total: totalChecks,
        success: successChecks,
        error: errorChecks,
        rate: totalChecks > 0 ? Math.round((successChecks / totalChecks) * 100) : 0,
      },
      recentErrors1h: {
        count: errorCount1h,
        lastMessage: recentErrors[0]?.errorMessage ?? null,
      },
      lastSuccessfulCheck: lastSuccess?.createdAt?.toISOString() ?? null,
      activeAccommodations: activeCount,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Monitoring summary error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
