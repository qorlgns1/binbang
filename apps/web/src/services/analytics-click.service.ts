import { prisma } from '@workspace/db';

import type { LandingEventName } from '@/lib/analytics/clickEventNames';

export interface CreateLandingClickEventInput {
  eventName: LandingEventName;
  source?: string;
  sessionId?: string;
  locale?: string;
  path?: string;
  referrer?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  occurredAt?: string;
}

export interface LandingClickEventRecord {
  eventId: string;
  eventName: LandingEventName;
  occurredAt: string;
}

export async function createLandingEvent(input: CreateLandingClickEventInput): Promise<LandingClickEventRecord> {
  let occurredAt = new Date();
  if (input.occurredAt) {
    const parsed = new Date(input.occurredAt);
    occurredAt = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  const created = await prisma.landingEvent.create({
    data: {
      eventName: input.eventName,
      source: input.source,
      sessionId: input.sessionId,
      locale: input.locale,
      path: input.path || '/',
      referrer: input.referrer ?? null,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      occurredAt,
    },
    select: {
      id: true,
      eventName: true,
      occurredAt: true,
    },
  });

  return {
    eventId: created.id,
    eventName: created.eventName as LandingEventName,
    occurredAt: created.occurredAt.toISOString(),
  };
}

/** @deprecated Use createLandingEvent. Kept for tests. */
export const createLandingClickEvent = createLandingEvent;
