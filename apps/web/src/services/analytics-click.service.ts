import { prisma } from '@workspace/db';

import type { LandingClickEventName } from '@/lib/analytics/click-event-names';

export interface CreateLandingClickEventInput {
  eventName: LandingClickEventName;
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
  eventName: LandingClickEventName;
  occurredAt: string;
}

export async function createLandingClickEvent(input: CreateLandingClickEventInput): Promise<LandingClickEventRecord> {
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();

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
    eventName: created.eventName as LandingClickEventName,
    occurredAt: created.occurredAt.toISOString(),
  };
}
