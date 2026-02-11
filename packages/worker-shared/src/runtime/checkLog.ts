import type { AvailabilityStatus } from '@workspace/db';
import { prisma } from '@workspace/db';
import { parsePrice } from '@workspace/shared';

import { nightsBetween } from './status';

export interface SaveCheckLogInput {
  accommodationId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  cycleId: string;
}

export async function saveCheckLog(
  input: SaveCheckLogInput,
  status: AvailabilityStatus,
  result: { price: string | null; error: string | null },
  extra: { durationMs: number; retryCount: number; previousStatus: AvailabilityStatus | null },
): Promise<string> {
  const parsed = parsePrice(result.price);
  const checkIn = new Date(input.checkIn);
  const checkOut = new Date(input.checkOut);
  const nights = nightsBetween(checkIn, checkOut);
  const pricePerNight = parsed ? Math.round(parsed.amount / nights) : null;

  const log = await prisma.checkLog.create({
    data: {
      accommodationId: input.accommodationId,
      userId: input.userId,
      status,
      price: result.price,
      priceAmount: parsed?.amount ?? null,
      priceCurrency: parsed?.currency ?? null,
      errorMessage: result.error,
      notificationSent: false,
      checkIn,
      checkOut,
      pricePerNight,
      cycleId: input.cycleId,
      durationMs: extra.durationMs,
      retryCount: extra.retryCount,
      previousStatus: extra.previousStatus,
    },
    select: { id: true },
  });

  return log.id;
}
