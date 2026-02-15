import { prisma } from '@workspace/db';

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
/**
 * Fetches heartbeat history for the past `hours` hours, ordered by timestamp ascending.
 *
 * @param hours - Lookback window in hours to retrieve records (defaults to 24)
 * @returns An array of heartbeat history items containing `id`, `timestamp`, `status`, `isProcessing`, `uptime`, and `workerId`
 */

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
