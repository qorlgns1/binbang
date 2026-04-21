import { Accommodation, CheckLog, getDataSource } from '@workspace/db';

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
  const ds = await getDataSource();

  const rows = await ds
    .getRepository(CheckLog)
    .createQueryBuilder('cl')
    .innerJoin(Accommodation, 'a', 'a.id = cl.accommodationId')
    .select('cl.id', 'id')
    .addSelect('cl.status', 'status')
    .addSelect('cl.price', 'price')
    .addSelect('cl.createdAt', 'createdAt')
    .addSelect('a.id', 'accommodationId')
    .addSelect('a.name', 'accommodationName')
    .addSelect('a.platform', 'accommodationPlatform')
    .where('a.userId = :userId', { userId })
    .orderBy('cl.createdAt', 'DESC')
    .limit(limit)
    .getRawMany<{
      id: string;
      status: string;
      price: string | null;
      createdAt: Date;
      accommodationId: string;
      accommodationName: string;
      accommodationPlatform: string;
    }>();

  return {
    logs: rows.map(
      (row): RecentLogItem => ({
        id: row.id,
        status: row.status,
        price: row.price,
        createdAt: new Date(row.createdAt).toISOString(),
        accommodation: {
          id: row.accommodationId,
          name: row.accommodationName,
          platform: row.accommodationPlatform,
        },
      }),
    ),
  };
}
