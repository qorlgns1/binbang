import { prisma } from '@workspace/db';

const DEFAULT_LOOKBACK_DAYS = 7;
const FALSE_POSITIVE_LIMIT = 20;
const DEFAULT_POLL_INTERVAL_MINUTES = 30;
const STALL_MULTIPLIER = 2;
const STALL_LIMIT = 20;

export interface AdminOpsFalsePositiveCandidate {
  eventId: string;
  detectedAt: string;
  accommodationId: string;
  accommodationName: string;
  eventType: string;
  eventStatus: string;
  notificationStatus: string | null;
  reason: string;
}

export interface StalledAccommodation {
  id: string;
  name: string;
  createdAt: string;
  lastPolledAt: string | null;
  stalledSinceMinutes: number;
}

export interface AdminOpsSummary {
  generatedAt: string;
  range: {
    from: string;
    to: string;
    days: number;
  };
  alerts: {
    total: number;
    active: number;
    registeredInRange: number;
  };
  notifications: {
    queued: number;
    sent: number;
    failed: number;
    suppressed: number;
    attempted: number;
    successRate: number;
  };
  falsePositiveCandidates: AdminOpsFalsePositiveCandidate[];
  stalled: {
    count: number;
    items: StalledAccommodation[];
  };
}

function startOfLookback(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function toRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function resolvePollIntervalMs(): number {
  const raw = process.env.BINBANG_POLL_INTERVAL_MINUTES;
  if (!raw) return DEFAULT_POLL_INTERVAL_MINUTES * 60 * 1000;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_POLL_INTERVAL_MINUTES * 60 * 1000;
  return parsed * 60 * 1000;
}

async function fetchStalledAccommodations(now: Date): Promise<StalledAccommodation[]> {
  const stallThreshold = new Date(now.getTime() - STALL_MULTIPLIER * resolvePollIntervalMs());

  const rows = await prisma.accommodation.findMany({
    where: {
      platform: 'AGODA',
      isActive: true,
      platformId: { not: null },
      checkIn: { gte: now },
      OR: [{ lastPolledAt: { lte: stallThreshold } }, { lastPolledAt: null, createdAt: { lte: stallThreshold } }],
    },
    orderBy: { lastPolledAt: 'asc' },
    take: STALL_LIMIT,
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastPolledAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    lastPolledAt: row.lastPolledAt?.toISOString() ?? null,
    stalledSinceMinutes: Math.floor(
      (now.getTime() - (row.lastPolledAt?.getTime() ?? row.createdAt.getTime())) / 60_000,
    ),
  }));
}

function buildFalsePositiveReason(input: { eventStatus: string; notificationStatus: string | null }): string {
  if (input.eventStatus === 'rejected_verify_failed') {
    return 'verify 단계에서 빈방 신호가 기각됨';
  }
  if (input.notificationStatus === 'failed') {
    return '알림 발송 실패 케이스';
  }
  if (input.notificationStatus === 'suppressed') {
    return '동의/조건 이슈로 알림 억제됨';
  }
  return '수동 검토 필요';
}

export async function getAdminOpsSummary(lookbackDays = DEFAULT_LOOKBACK_DAYS): Promise<AdminOpsSummary> {
  const now = new Date();
  const days = Number.isFinite(lookbackDays) ? Math.max(1, Math.floor(lookbackDays)) : DEFAULT_LOOKBACK_DAYS;
  const from = startOfLookback(now, days);

  const [alertsTotal, alertsActive, alertsRegisteredInRange, notificationGroups, falsePositiveRows, stalledItems] =
    await Promise.all([
      prisma.accommodation.count({
        where: { platform: 'AGODA' },
      }),
      prisma.accommodation.count({
        where: { platform: 'AGODA', isActive: true },
      }),
      prisma.accommodation.count({
        where: { platform: 'AGODA', createdAt: { gte: from } },
      }),
      prisma.agodaNotification.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: from },
        },
        _count: {
          _all: true,
        },
      }),
      prisma.agodaAlertEvent.findMany({
        where: {
          detectedAt: { gte: from },
          OR: [
            { status: 'rejected_verify_failed' },
            {
              status: 'detected',
              notifications: {
                some: { status: { in: ['failed', 'suppressed'] } },
              },
            },
          ],
        },
        orderBy: { detectedAt: 'desc' },
        take: FALSE_POSITIVE_LIMIT,
        select: {
          id: true,
          accommodationId: true,
          detectedAt: true,
          type: true,
          status: true,
          accommodation: {
            select: {
              id: true,
              name: true,
            },
          },
          notifications: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              status: true,
            },
          },
        },
      }),
      fetchStalledAccommodations(now),
    ]);

  const counts = notificationGroups.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  const queued = counts.queued ?? 0;
  const sent = counts.sent ?? 0;
  const failed = counts.failed ?? 0;
  const suppressed = counts.suppressed ?? 0;
  const attempted = sent + failed;

  return {
    generatedAt: now.toISOString(),
    range: {
      from: from.toISOString(),
      to: now.toISOString(),
      days,
    },
    alerts: {
      total: alertsTotal,
      active: alertsActive,
      registeredInRange: alertsRegisteredInRange,
    },
    notifications: {
      queued,
      sent,
      failed,
      suppressed,
      attempted,
      successRate: toRate(sent, attempted),
    },
    falsePositiveCandidates: falsePositiveRows.map((row) => {
      const notificationStatus = row.notifications[0]?.status ?? null;
      return {
        eventId: row.id.toString(),
        detectedAt: row.detectedAt.toISOString(),
        accommodationId: row.accommodationId,
        accommodationName: row.accommodation?.name ?? '(deleted)',
        eventType: row.type,
        eventStatus: row.status,
        notificationStatus,
        reason: buildFalsePositiveReason({
          eventStatus: row.status,
          notificationStatus,
        }),
      };
    }),
    stalled: {
      count: stalledItems.length,
      items: stalledItems,
    },
  };
}
