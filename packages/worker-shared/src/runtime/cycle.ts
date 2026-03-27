import type { AvailabilityStatus, Platform } from '@workspace/db';
import { prisma } from '@workspace/db';

import { updateHeartbeat } from './heartbeat';

export interface ActiveAccommodation {
  id: string;
  name: string;
  url: string;
  platform: Platform;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  lastStatus: AvailabilityStatus | null;
  user: { id: string; kakaoAccessToken: string | null };
}

export async function findActiveAccommodations(): Promise<ActiveAccommodation[]> {
  const accommodations = await prisma.accommodation.findMany({
    where: {
      isActive: true,
      checkIn: { gte: new Date() },
    },
    select: {
      id: true,
      name: true,
      url: true,
      platformId: true,
      platform: true,
      checkIn: true,
      checkOut: true,
      adults: true,
      lastStatus: true,
      user: { select: { id: true, kakaoAccessToken: true } },
    },
  });

  return accommodations.flatMap((accommodation) => {
    const url =
      accommodation.url ??
      (accommodation.platform === 'AGODA' && accommodation.platformId
        ? `https://www.agoda.com/hotel-detail/${accommodation.platformId}`
        : null);

    return url ? [{ ...accommodation, url }] : [];
  });
}

export interface CreateCheckCycleInput {
  startedAt: Date;
  totalCount: number;
  concurrency: number;
  browserPoolSize: number;
  navigationTimeoutMs: number;
  contentWaitMs: number;
  maxRetries: number;
}

export async function createCheckCycle(input: CreateCheckCycleInput): Promise<string> {
  const cycle = await prisma.checkCycle.create({
    data: input,
    select: { id: true },
  });
  return cycle.id;
}

export async function finalizeCycleCounter(cycleId: string, success: boolean): Promise<void> {
  const cycleDurationMs = await prisma.$transaction(async (tx): Promise<number | null> => {
    const updatedCycle = await tx.checkCycle.update({
      where: { id: cycleId },
      data: success ? { successCount: { increment: 1 } } : { errorCount: { increment: 1 } },
      select: { successCount: true, errorCount: true, totalCount: true, completedAt: true, startedAt: true },
    });

    const completedCount = (updatedCycle.successCount ?? 0) + (updatedCycle.errorCount ?? 0);
    if (updatedCycle.totalCount && completedCount >= updatedCycle.totalCount && !updatedCycle.completedAt) {
      const durationMs = Date.now() - new Date(updatedCycle.startedAt).getTime();
      await tx.checkCycle.update({
        where: { id: cycleId },
        data: { completedAt: new Date(), durationMs },
        select: { id: true },
      });
      return durationMs;
    }

    return null;
  });

  if (cycleDurationMs != null) {
    await updateHeartbeat(false);
    console.log(`\nMonitoring completed (${Math.round(cycleDurationMs / 1000)}s)\n`);
  }
}
