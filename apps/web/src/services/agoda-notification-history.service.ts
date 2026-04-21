import { Accommodation, AgodaNotification, getDataSource } from '@workspace/db';

const DEFAULT_HISTORY_LIMIT = 20;

export interface NotificationHistoryItem {
  notificationId: string;
  eventId: string;
  type: string;
  status: string;
  sentAt: string | null;
  detectedAt: string;
  meta: {
    currency?: string;
    afterPrice?: number;
    afterRemainingRooms?: number;
    dropRatio?: number;
  };
}

function parseHistoryMeta(meta: unknown): NotificationHistoryItem['meta'] {
  if (typeof meta !== 'object' || meta == null) return {};
  const value = meta as Record<string, unknown>;

  return {
    currency: typeof value.currency === 'string' ? value.currency : undefined,
    afterPrice: typeof value.afterPrice === 'number' ? value.afterPrice : undefined,
    afterRemainingRooms: typeof value.afterRemainingRooms === 'number' ? value.afterRemainingRooms : undefined,
    dropRatio: typeof value.dropRatio === 'number' ? value.dropRatio : undefined,
  };
}

export async function getNotificationHistory(params: {
  accommodationId: string;
  userId: string;
  limit?: number;
}): Promise<NotificationHistoryItem[]> {
  const ds = await getDataSource();

  const ownership = await ds.getRepository(Accommodation).findOne({
    where: { id: params.accommodationId, userId: params.userId },
    select: { id: true },
  });

  if (!ownership) return [];

  const rows = await ds.getRepository(AgodaNotification).find({
    where: { accommodationId: params.accommodationId },
    relations: { alertEvent: true },
    order: { createdAt: 'DESC', id: 'DESC' },
    take: params.limit ?? DEFAULT_HISTORY_LIMIT,
  });

  return rows.map((row) => ({
    notificationId: row.id.toString(),
    eventId: row.alertEvent.id.toString(),
    type: row.alertEvent.type,
    status: row.status,
    sentAt: row.sentAt?.toISOString() ?? null,
    detectedAt: row.alertEvent.detectedAt.toISOString(),
    meta: parseHistoryMeta(row.alertEvent.meta),
  }));
}
