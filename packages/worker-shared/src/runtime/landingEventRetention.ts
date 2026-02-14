import { prisma } from '@workspace/db';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS = 30;

export interface LandingEventPiiRetentionInput {
  retentionDays?: number;
  now?: Date;
}

export interface LandingEventPiiRetentionResult {
  retentionDays: number;
  cutoffAt: string;
  anonymizedCount: number;
}

function resolveRetentionDays(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_LANDING_EVENT_PII_RETENTION_DAYS;
  }

  return Math.floor(value);
}

export async function anonymizeExpiredLandingEventPii(
  input: LandingEventPiiRetentionInput = {},
): Promise<LandingEventPiiRetentionResult> {
  const now = input.now ?? new Date();
  const retentionDays = resolveRetentionDays(input.retentionDays);
  const cutoff = new Date(now.getTime() - retentionDays * DAY_IN_MS);

  const updated = await prisma.landingEvent.updateMany({
    where: {
      occurredAt: { lt: cutoff },
      OR: [{ ipAddress: { not: null } }, { userAgent: { not: null } }],
    },
    data: {
      ipAddress: null,
      userAgent: null,
    },
  });

  return {
    retentionDays,
    cutoffAt: cutoff.toISOString(),
    anonymizedCount: updated.count,
  };
}
