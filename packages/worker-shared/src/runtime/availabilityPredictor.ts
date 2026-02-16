import { type PredictionConfidence, prisma } from '@workspace/db';
import { startOfUtcDay, addUtcDays } from '@workspace/shared/utils/date';

export const DEFAULT_PREDICTION_WINDOW_DAYS = 28;
const MIN_SNAPSHOTS_FOR_PREDICTION = 4;
const HIGH_CONFIDENCE_MIN_SNAPSHOTS = 14;
const MEDIUM_CONFIDENCE_MIN_SNAPSHOTS = 7;
const DAYS_OF_WEEK = 7;

export interface GeneratePredictionsInput {
  now?: Date;
  windowDays?: number;
  limit?: number;
}

export interface GeneratePredictionsResult {
  processedProperties: number;
  predictionsCreated: number;
  skippedInsufficientData: number;
  queryTimeMs: number;
  computeTimeMs: number;
  upsertTimeMs: number;
}

interface DayOfWeekStats {
  dayOfWeek: number;
  totalOpenRate: number;
  snapshotCount: number;
  avgOpenRate: number;
}

interface PropertySnapshotRow {
  publicPropertyId: string;
  snapshotDate: Date;
  openRate: number | null;
  sampleSize: number;
}

function computeConfidence(snapshotCount: number, patternStrength: number): PredictionConfidence {
  if (snapshotCount >= HIGH_CONFIDENCE_MIN_SNAPSHOTS && patternStrength >= 0.3) {
    return 'HIGH';
  }
  if (snapshotCount >= MEDIUM_CONFIDENCE_MIN_SNAPSHOTS && patternStrength >= 0.15) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function buildReasoning(
  bestDay: DayOfWeekStats,
  avgOpenRate: number,
  snapshotCount: number,
  dayNames: string[],
): string {
  const dayName = dayNames[bestDay.dayOfWeek] ?? `Day ${bestDay.dayOfWeek}`;
  const bestRate = (bestDay.avgOpenRate * 100).toFixed(1);
  const overallRate = (avgOpenRate * 100).toFixed(1);

  return (
    `Based on ${snapshotCount} snapshots over the analysis window, ` +
    `${dayName} shows the highest availability rate at ${bestRate}% ` +
    `(overall average: ${overallRate}%). ` +
    `Pattern strength: ${((bestDay.avgOpenRate - avgOpenRate) * 100).toFixed(1)}pp above average.`
  );
}

function findNextOccurrence(targetDayOfWeek: number, now: Date): Date {
  const currentDay = now.getUTCDay();
  let daysUntil = targetDayOfWeek - currentDay;
  if (daysUntil <= 0) daysUntil += DAYS_OF_WEEK;

  const nextDate = addUtcDays(startOfUtcDay(now), daysUntil);
  nextDate.setUTCHours(15, 0, 0, 0);
  return nextDate;
}

export async function generatePredictions(input: GeneratePredictionsInput = {}): Promise<GeneratePredictionsResult> {
  const now = input.now ?? new Date();
  const windowDays = input.windowDays ?? DEFAULT_PREDICTION_WINDOW_DAYS;
  const limit = input.limit ?? 500;
  const windowStart = startOfUtcDay(addUtcDays(now, -windowDays));
  const predictedAt = startOfUtcDay(now);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const queryStart = Date.now();

  const snapshots = await prisma.$queryRaw<PropertySnapshotRow[]>`
    SELECT
      s."publicPropertyId",
      s."snapshotDate",
      s."openRate",
      s."sampleSize"
    FROM "PublicAvailabilitySnapshot" s
    JOIN "PublicProperty" p ON p."id" = s."publicPropertyId"
    WHERE s."snapshotDate" >= ${windowStart}
      AND p."isActive" = true
      AND s."openRate" IS NOT NULL
      AND s."sampleSize" > 0
    ORDER BY s."publicPropertyId", s."snapshotDate"
  `;

  const queryTimeMs = Date.now() - queryStart;
  const computeStart = Date.now();

  const propertySnapshots = new Map<string, PropertySnapshotRow[]>();
  for (const row of snapshots) {
    const existing = propertySnapshots.get(row.publicPropertyId);
    if (existing) {
      existing.push(row);
    } else {
      propertySnapshots.set(row.publicPropertyId, [row]);
    }
  }

  interface PredictionCandidate {
    publicPropertyId: string;
    nextLikelyAvailableAt: Date | null;
    confidence: PredictionConfidence;
    reasoning: string;
  }

  const candidates: PredictionCandidate[] = [];
  let skippedInsufficientData = 0;
  let processedCount = 0;

  for (const [propertyId, rows] of propertySnapshots) {
    if (processedCount >= limit) break;
    processedCount++;

    if (rows.length < MIN_SNAPSHOTS_FOR_PREDICTION) {
      skippedInsufficientData++;
      continue;
    }

    const dayStats: DayOfWeekStats[] = Array.from({ length: DAYS_OF_WEEK }, (_, i) => ({
      dayOfWeek: i,
      totalOpenRate: 0,
      snapshotCount: 0,
      avgOpenRate: 0,
    }));

    let totalOpenRate = 0;
    let validCount = 0;

    for (const row of rows) {
      if (typeof row.openRate !== 'number') continue;

      const dayOfWeek = row.snapshotDate.getUTCDay();
      const stats = dayStats[dayOfWeek];
      stats.totalOpenRate += row.openRate;
      stats.snapshotCount += 1;

      totalOpenRate += row.openRate;
      validCount++;
    }

    if (validCount < MIN_SNAPSHOTS_FOR_PREDICTION) {
      skippedInsufficientData++;
      continue;
    }

    const overallAvg = totalOpenRate / validCount;

    for (const stats of dayStats) {
      stats.avgOpenRate = stats.snapshotCount > 0 ? stats.totalOpenRate / stats.snapshotCount : 0;
    }

    const activeDays = dayStats.filter((d) => d.snapshotCount > 0);
    if (activeDays.length === 0) {
      skippedInsufficientData++;
      continue;
    }

    const bestDay = activeDays.reduce((best, current) => (current.avgOpenRate > best.avgOpenRate ? current : best));

    const patternStrength = bestDay.avgOpenRate - overallAvg;
    const confidence = computeConfidence(rows.length, patternStrength);
    const reasoning = buildReasoning(bestDay, overallAvg, rows.length, dayNames);

    const nextLikelyAvailableAt = bestDay.avgOpenRate > 0 ? findNextOccurrence(bestDay.dayOfWeek, now) : null;

    candidates.push({
      publicPropertyId: propertyId,
      nextLikelyAvailableAt,
      confidence,
      reasoning,
    });
  }

  const computeTimeMs = Date.now() - computeStart;
  const upsertStart = Date.now();

  const UPSERT_BATCH_SIZE = 50;
  let predictionsCreated = 0;

  for (let i = 0; i < candidates.length; i += UPSERT_BATCH_SIZE) {
    const batch = candidates.slice(i, i + UPSERT_BATCH_SIZE);
    const operations = batch.map((candidate) =>
      prisma.publicAvailabilityPrediction.upsert({
        where: {
          publicPropertyId_predictedAt: {
            publicPropertyId: candidate.publicPropertyId,
            predictedAt,
          },
        },
        create: {
          publicPropertyId: candidate.publicPropertyId,
          predictedAt,
          nextLikelyAvailableAt: candidate.nextLikelyAvailableAt,
          confidence: candidate.confidence,
          reasoning: candidate.reasoning,
          windowDays,
          algorithmVersion: 'v1.0',
        },
        update: {
          nextLikelyAvailableAt: candidate.nextLikelyAvailableAt,
          confidence: candidate.confidence,
          reasoning: candidate.reasoning,
          windowDays,
          algorithmVersion: 'v1.0',
        },
      }),
    );

    await prisma.$transaction(operations);
    predictionsCreated += batch.length;
  }

  const upsertTimeMs = Date.now() - upsertStart;

  return {
    processedProperties: processedCount,
    predictionsCreated,
    skippedInsufficientData,
    queryTimeMs,
    computeTimeMs,
    upsertTimeMs,
  };
}
