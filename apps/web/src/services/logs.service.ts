import prisma from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface RecentLogItem {
  id: string;
  status: string;
  price: string | null;
  createdAt: string;
  accommodation: {
    id: string;
    name: string;
    platform: string;
  };
}

export interface RecentLogsResponse {
  logs: RecentLogItem[];
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getRecentLogs(userId: string, limit: number = 10): Promise<RecentLogsResponse> {
  const logs = await prisma.checkLog.findMany({
    where: {
      accommodation: { userId },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      status: true,
      price: true,
      createdAt: true,
      accommodation: {
        select: { id: true, name: true, platform: true },
      },
    },
  });

  return {
    logs: logs.map(
      (log): RecentLogItem => ({
        id: log.id,
        status: log.status,
        price: log.price,
        createdAt: log.createdAt.toISOString(),
        accommodation: log.accommodation,
      }),
    ),
  };
}
