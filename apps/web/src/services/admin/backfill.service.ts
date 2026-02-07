import { parsePrice } from '@workspace/shared/checkers';

import prisma from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export interface BackfillPricesResult {
  checkLogs: {
    updated: number;
    skipped: number;
  };
  accommodations: {
    updated: number;
    total: number;
  };
}

// ============================================================================
// Service Functions
// ============================================================================

const BATCH_SIZE = 500;

export async function backfillPrices(): Promise<BackfillPricesResult> {
  let updatedLogs = 0;
  let skippedLogs = 0;
  let cursor: string | undefined;

  // CheckLog 백필
  while (true) {
    const logs = await prisma.checkLog.findMany({
      where: { price: { not: null }, priceAmount: null },
      select: { id: true, price: true },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (logs.length === 0) break;

    const updates = [];
    for (const log of logs) {
      const parsed = parsePrice(log.price);
      if (parsed) {
        updates.push(
          prisma.checkLog.update({
            where: { id: log.id },
            data: { priceAmount: parsed.amount, priceCurrency: parsed.currency },
          }),
        );
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    updatedLogs += updates.length;
    skippedLogs += logs.length - updates.length;
    cursor = logs[logs.length - 1].id;
  }

  // Accommodation 백필
  const accommodations = await prisma.accommodation.findMany({
    where: { lastPrice: { not: null }, lastPriceAmount: null },
    select: { id: true, lastPrice: true },
  });

  let updatedAccommodations = 0;
  const accUpdates = [];
  for (const acc of accommodations) {
    const parsed = parsePrice(acc.lastPrice);
    if (parsed) {
      accUpdates.push(
        prisma.accommodation.update({
          where: { id: acc.id },
          data: { lastPriceAmount: parsed.amount, lastPriceCurrency: parsed.currency },
        }),
      );
    }
  }

  if (accUpdates.length > 0) {
    await prisma.$transaction(accUpdates);
    updatedAccommodations = accUpdates.length;
  }

  return {
    checkLogs: { updated: updatedLogs, skipped: skippedLogs },
    accommodations: { updated: updatedAccommodations, total: accommodations.length },
  };
}
