import { LandingEvent, getDataSource } from '@workspace/db';

import type { PlannerEventName } from '@/lib/plannerTracking';

export interface CreatePlannerEventInput {
  eventName: PlannerEventName;
  source?: string;
  sessionId?: string;
  locale?: string;
  path?: string;
  referrer?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  occurredAt?: string;
}

export interface PlannerEventRecord {
  eventId: string;
  eventName: PlannerEventName;
  occurredAt: string;
}

export async function createPlannerEvent(input: CreatePlannerEventInput): Promise<PlannerEventRecord> {
  let occurredAt = new Date();
  if (input.occurredAt) {
    const parsed = new Date(input.occurredAt);
    occurredAt = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  const ds = await getDataSource();
  const eventRepo = ds.getRepository(LandingEvent);
  const created = eventRepo.create({
    eventName: input.eventName,
    source: input.source ?? null,
    sessionId: input.sessionId ?? null,
    locale: input.locale ?? null,
    path: input.path || '/chat',
    referrer: input.referrer ?? null,
    userAgent: input.userAgent ?? null,
    ipAddress: input.ipAddress ?? null,
    occurredAt,
  });
  await eventRepo.save(created);

  return {
    eventId: created.id,
    eventName: created.eventName as PlannerEventName,
    occurredAt: created.occurredAt.toISOString(),
  };
}
