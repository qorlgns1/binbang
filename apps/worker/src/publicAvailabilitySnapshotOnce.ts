import { prisma } from '@workspace/db';
import { refreshPublicAvailabilitySnapshots } from '@workspace/worker-shared/runtime';
import 'dotenv/config';

function parseWindowDays(argv: string[]): number | undefined {
  const raw =
    argv.find((arg) => arg.startsWith('--windowDays=')) ?? argv.find((arg) => arg.startsWith('--window-days='));
  if (!raw) return undefined;

  const [, value] = raw.split('=');
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --windowDays value: ${value}`);
  }
  return parsed;
}

async function main(): Promise<void> {
  const startTime = Date.now();
  const windowDays = parseWindowDays(process.argv.slice(2));
  const result = await refreshPublicAvailabilitySnapshots({ windowDays });
  const durationMs = Date.now() - startTime;

  // 품질 지표 계산
  const skipRate = result.scannedAccommodations > 0 ? result.skippedWithoutKey / result.scannedAccommodations : 0;
  const upsertRate = result.scannedAccommodations > 0 ? result.upsertedProperties / result.scannedAccommodations : 0;

  console.log(
    `[public-availability-snapshot:once] snapshotDate=${result.snapshotDate} window=${result.windowStartAt}~${result.windowEndAt} scanned=${result.scannedAccommodations} properties=${result.upsertedProperties} snapshots=${result.upsertedSnapshots} skippedWithoutKey=${result.skippedWithoutKey} skipRate=${(skipRate * 100).toFixed(2)}% upsertRate=${(upsertRate * 100).toFixed(2)}% durationMs=${durationMs} queryMs=${result.queryTimeMs} aggregationMs=${result.aggregationTimeMs} upsertMs=${result.upsertTimeMs}`,
  );

  // 품질 경고
  if (skipRate > 0.1) {
    console.warn(
      `⚠️  [quality-warning] High skip rate detected: ${(skipRate * 100).toFixed(2)}% (${result.skippedWithoutKey}/${result.scannedAccommodations}). Check platformPropertyKey derivation logic.`,
    );
  }

  if (result.upsertedProperties === 0 && result.scannedAccommodations > 0) {
    console.error(
      `❌ [quality-error] No properties upserted despite ${result.scannedAccommodations} accommodations scanned. Data pipeline may be broken.`,
    );
    process.exitCode = 1;
  }

  if (durationMs > 5 * 60 * 1000) {
    // 5분 이상
    console.warn(
      `⚠️  [performance-warning] Snapshot generation took ${(durationMs / 1000).toFixed(2)}s. Consider optimization.`,
    );
  }
}

main()
  .catch((error: unknown): void => {
    console.error('[public-availability-snapshot:once] failed', error);
    process.exitCode = 1;
  })
  .finally(async (): Promise<void> => {
    await prisma.$disconnect();
  });
