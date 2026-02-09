import prisma from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface HeartbeatHistoryItem {
  id: number;
  timestamp: Date;
  status: string;
  isProcessing: boolean;
  uptime: number | null;
  workerId: string;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getHeartbeatHistory(hours: number = 24): Promise<HeartbeatHistoryItem[]> {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  return prisma.heartbeatHistory.findMany({
    select: {
      id: true,
      timestamp: true,
      status: true,
      isProcessing: true,
      uptime: true,
      workerId: true,
    },
    where: {
      timestamp: {
        gte: since,
      },
    },
    orderBy: {
      timestamp: 'asc',
    },
  });
}
