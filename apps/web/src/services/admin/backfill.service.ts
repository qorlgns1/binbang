import { parsePrice } from '@workspace/shared';

import { Accommodation, CheckLog, IsNull, MoreThan, Not, getDataSource } from '@workspace/db';

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

  const ds = await getDataSource();
  const checkLogRepo = ds.getRepository(CheckLog);

  // CheckLog 백필
  while (true) {
    const logs = await checkLogRepo.find({
      where: {
        price: Not(IsNull()),
        priceAmount: IsNull(),
        ...(cursor ? { id: MoreThan(cursor) } : {}),
      },
      select: { id: true, price: true },
      order: { id: 'ASC' },
      take: BATCH_SIZE,
    });

    if (logs.length === 0) break;

    let batchUpdated = 0;
    for (const log of logs) {
      const parsed = parsePrice(log.price);
      if (parsed) {
        await checkLogRepo.update({ id: log.id }, { priceAmount: parsed.amount, priceCurrency: parsed.currency });
        batchUpdated++;
      }
    }

    updatedLogs += batchUpdated;
    skippedLogs += logs.length - batchUpdated;
    cursor = logs[logs.length - 1].id;
  }

  // Accommodation 백필
  const accRepo = ds.getRepository(Accommodation);
  const accommodations = await accRepo.find({
    where: { lastPrice: Not(IsNull()), lastPriceAmount: IsNull() },
    select: { id: true, lastPrice: true },
  });

  let updatedAccommodations = 0;
  for (const acc of accommodations) {
    const parsed = parsePrice(acc.lastPrice);
    if (parsed) {
      await accRepo.update({ id: acc.id }, { lastPriceAmount: parsed.amount, lastPriceCurrency: parsed.currency });
      updatedAccommodations++;
    }
  }

  return {
    checkLogs: { updated: updatedLogs, skipped: skippedLogs },
    accommodations: { updated: updatedAccommodations, total: accommodations.length },
  };
}
