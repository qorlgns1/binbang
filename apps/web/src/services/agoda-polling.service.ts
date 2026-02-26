import type { Prisma } from '@workspace/db';
import { prisma } from '@workspace/db';

import { normalizeAgodaSearchResponse } from '@/lib/agoda/normalize';
import { searchAgodaAvailability } from '@/lib/agoda/searchClient';
import { detectPriceDropEvents, detectVacancyEvents } from '@/services/agoda-detector.service';

const MAX_ERROR_LENGTH = 1000;
const DEFAULT_DUE_POLL_INTERVAL_MINUTES = 30;
const DEFAULT_DUE_POLL_LIMIT = 20;
const DEFAULT_DUE_POLL_CONCURRENCY = 3;
const DEFAULT_PRICE_DROP_RATIO = 0.1;
const DEFAULT_VACANCY_COOLDOWN_HOURS = 24;
const DEFAULT_PRICE_DROP_COOLDOWN_HOURS = 6;

interface OfferSnapshotSeed {
  offerKey: string;
  remainingRooms: number | null;
  totalInclusive: number | null;
  payloadHash: string;
}

export interface PollAccommodationResult {
  accommodationId: string;
  pollRunId: string;
  polledAt: string;
  httpStatus: number | null;
  latencyMs: number;
  snapshotsInserted: number;
  vacancyEventsDetected: number;
  vacancyEventsRejectedByVerify: number;
  vacancyEventsInserted: number;
  vacancyEventsSkippedByCooldown: number;
  priceDropEventsDetected: number;
  priceDropEventsInserted: number;
  priceDropEventsSkippedByCooldown: number;
  notificationsQueued: number;
}

export interface PollDueAccommodationsResult {
  now: string;
  dueCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  failures: Array<{ accommodationId: string; reason: string }>;
  results: PollAccommodationResult[];
}

function dateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toAgodaLanguageCode(locale: string): string {
  const normalized = locale.trim().toLowerCase();
  if (normalized === 'ko') return 'ko-kr';
  if (normalized === 'en') return 'en-us';
  return normalized;
}

function parsePositiveInteger(value: string | undefined, fallbackValue: number): number {
  if (!value) return fallbackValue;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackValue;
  return parsed;
}

function parsePositiveRatio(value: string | undefined, fallbackValue: number): number {
  if (!value) return fallbackValue;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 1) return fallbackValue;
  return parsed;
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function buildSnapshotSeed(
  rows: Array<{
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    remainingRooms: number | null;
    totalInclusive: Prisma.Decimal | number | null;
    payloadHash: string;
  }>,
): OfferSnapshotSeed[] {
  const byOfferKey = new Map<string, OfferSnapshotSeed>();

  for (const row of rows) {
    const offerKey = `${row.propertyId}:${row.roomId}:${row.ratePlanId}`;
    if (byOfferKey.has(offerKey)) continue;
    byOfferKey.set(offerKey, {
      offerKey,
      remainingRooms: row.remainingRooms,
      totalInclusive: row.totalInclusive != null ? Number(row.totalInclusive) : null,
      payloadHash: row.payloadHash,
    });
  }

  return [...byOfferKey.values()];
}

function normalizeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, MAX_ERROR_LENGTH);
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && (error as { code?: string }).code === 'P2002';
}

async function isInCooldown(params: {
  accommodationId: string;
  type: 'vacancy' | 'price_drop' | 'vacancy_proxy';
  offerKey: string;
}): Promise<boolean> {
  const cooldownHours =
    params.type === 'price_drop'
      ? parsePositiveInteger(process.env.MOONCATCH_PRICE_DROP_COOLDOWN_HOURS, DEFAULT_PRICE_DROP_COOLDOWN_HOURS)
      : parsePositiveInteger(process.env.MOONCATCH_VACANCY_COOLDOWN_HOURS, DEFAULT_VACANCY_COOLDOWN_HOURS);

  const cooldownFrom = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);

  const existing = await prisma.agodaAlertEvent.findFirst({
    where: {
      accommodationId: params.accommodationId,
      type: params.type,
      offerKey: params.offerKey,
      status: 'detected',
      detectedAt: { gte: cooldownFrom },
    },
    select: { id: true },
  });

  return existing != null;
}

async function createAlertEventWithDedupe(params: {
  accommodationId: string;
  type: 'vacancy' | 'price_drop' | 'vacancy_proxy';
  eventKey: string;
  offerKey?: string;
  status: string;
  beforeHash: string | null;
  afterHash: string | null;
  meta: Prisma.InputJsonValue;
}): Promise<bigint | null> {
  try {
    const created = await prisma.agodaAlertEvent.create({
      data: {
        accommodationId: params.accommodationId,
        type: params.type,
        eventKey: params.eventKey,
        offerKey: params.offerKey,
        status: params.status,
        beforeHash: params.beforeHash,
        afterHash: params.afterHash,
        meta: params.meta,
      },
      select: { id: true },
    });

    return created.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return null;
    }
    throw error;
  }
}

function resolvePriceDropThreshold(): number {
  return parsePositiveRatio(process.env.MOONCATCH_PRICE_DROP_THRESHOLD, DEFAULT_PRICE_DROP_RATIO);
}

async function verifyVacancyCandidates(params: {
  accommodationCriteria: {
    platformId: string;
    checkIn: Date;
    checkOut: Date;
    rooms: number;
    adults: number;
    children: number;
    currency: string;
    locale: string;
  };
  candidates: ReturnType<typeof detectVacancyEvents>;
}): Promise<{ confirmed: ReturnType<typeof detectVacancyEvents>; rejected: ReturnType<typeof detectVacancyEvents> }> {
  if (params.candidates.length === 0) {
    return { confirmed: [], rejected: [] };
  }

  const propertyId = BigInt(params.accommodationCriteria.platformId);

  const verifyApiResult = await searchAgodaAvailability({
    waitTime: 8,
    criteria: {
      propertyIds: [propertyId],
      checkIn: dateOnlyString(params.accommodationCriteria.checkIn),
      checkOut: dateOnlyString(params.accommodationCriteria.checkOut),
      rooms: params.accommodationCriteria.rooms,
      adults: params.accommodationCriteria.adults,
      children: params.accommodationCriteria.children,
      currency: params.accommodationCriteria.currency,
      language: toAgodaLanguageCode(params.accommodationCriteria.locale),
    },
    features: {
      ratesPerProperty: 25,
      extra: ['rateDetail'],
    },
  });

  const verifyOffers = normalizeAgodaSearchResponse(verifyApiResult.payload).offers;

  // lt_v1 API는 remainingRooms를 반환하지 않으므로, 호텔이 결과에 존재하는지 여부로 판단한다.
  if (verifyOffers.length > 0) {
    return { confirmed: params.candidates, rejected: [] };
  }
  return { confirmed: [], rejected: params.candidates };
}

async function enqueueNotifications(params: { accommodationId: string; alertEventIds: bigint[] }): Promise<number> {
  if (params.alertEventIds.length === 0) return 0;

  const created = await prisma.agodaNotification.createMany({
    data: params.alertEventIds.map((alertEventId) => ({
      accommodationId: params.accommodationId,
      alertEventId,
      channel: 'email',
      status: 'queued',
      attempt: 0,
    })),
  });

  return created.count;
}

export async function pollAccommodationOnce(accommodationId: string): Promise<PollAccommodationResult> {
  const accommodation = await prisma.accommodation.findUnique({
    where: { id: accommodationId },
    select: {
      id: true,
      isActive: true,
      platform: true,
      platformId: true,
      checkIn: true,
      checkOut: true,
      rooms: true,
      adults: true,
      children: true,
      currency: true,
      locale: true,
    },
  });

  if (!accommodation) {
    throw new Error('accommodation not found');
  }

  if (!accommodation.isActive) {
    throw new Error('accommodation is not active');
  }

  if (accommodation.platform !== 'AGODA' || !accommodation.platformId) {
    throw new Error('accommodation is not an AGODA API accommodation (missing platformId)');
  }

  const pollRun = await prisma.agodaPollRun.create({
    data: {
      accommodationId,
      status: 'started',
    },
    select: { id: true, polledAt: true },
  });

  const pipelineStartedAt = Date.now();

  try {
    const latestSuccessfulRun = await prisma.agodaPollRun.findFirst({
      where: { accommodationId, status: 'success' },
      orderBy: { polledAt: 'desc' },
      select: { id: true },
    });

    const previousRows = latestSuccessfulRun
      ? await prisma.agodaRoomSnapshot.findMany({
          where: { accommodationId, pollRunId: latestSuccessfulRun.id },
          select: {
            propertyId: true,
            roomId: true,
            ratePlanId: true,
            remainingRooms: true,
            totalInclusive: true,
            payloadHash: true,
          },
        })
      : [];

    const previousSnapshots = buildSnapshotSeed(previousRows);
    const propertyId = BigInt(accommodation.platformId);

    const apiResult = await searchAgodaAvailability({
      waitTime: 20,
      criteria: {
        propertyIds: [propertyId],
        checkIn: dateOnlyString(accommodation.checkIn),
        checkOut: dateOnlyString(accommodation.checkOut),
        rooms: accommodation.rooms,
        adults: accommodation.adults,
        children: accommodation.children,
        currency: accommodation.currency,
        language: toAgodaLanguageCode(accommodation.locale),
      },
      features: {
        ratesPerProperty: 25,
        extra: ['rateDetail', 'dailyRate', 'cancellationDetail', 'metaSearch'],
      },
    });

    const normalized = normalizeAgodaSearchResponse(apiResult.payload);

    if (normalized.offers.length > 0) {
      await prisma.agodaRoomSnapshot.createMany({
        data: normalized.offers.map((offer) => ({
          pollRunId: pollRun.id,
          accommodationId,
          propertyId: offer.propertyId.toString(),
          roomId: offer.roomId.toString(),
          ratePlanId: offer.ratePlanId.toString(),
          remainingRooms: offer.remainingRooms,
          freeCancellation: offer.freeCancellation,
          freeCancellationDate: offer.freeCancellationDate,
          totalInclusive: offer.totalInclusive,
          currency: offer.currency,
          payloadHash: offer.payloadHash,
          raw: toJsonValue(offer.raw),
        })),
      });
    }

    const vacancyEvents = detectVacancyEvents({
      accommodationId,
      previousSnapshots,
      currentOffers: normalized.offers,
      hasBaseline: latestSuccessfulRun != null,
    });

    let verifyResult: Awaited<ReturnType<typeof verifyVacancyCandidates>>;
    try {
      verifyResult = await verifyVacancyCandidates({
        accommodationCriteria: {
          platformId: accommodation.platformId,
          checkIn: accommodation.checkIn,
          checkOut: accommodation.checkOut,
          rooms: accommodation.rooms,
          adults: accommodation.adults,
          children: accommodation.children,
          currency: accommodation.currency,
          locale: accommodation.locale,
        },
        candidates: vacancyEvents,
      });
    } catch {
      verifyResult = { confirmed: [], rejected: vacancyEvents };
    }

    const priceDropEvents = detectPriceDropEvents({
      accommodationId,
      previousSnapshots,
      currentOffers: normalized.offers,
      minDropRatio: resolvePriceDropThreshold(),
    });

    const alertEventIdsToNotify: bigint[] = [];
    let vacancyEventsInserted = 0;
    let vacancyEventsSkippedByCooldown = 0;
    let priceDropEventsInserted = 0;
    let priceDropEventsSkippedByCooldown = 0;

    for (const event of verifyResult.confirmed) {
      if (await isInCooldown({ accommodationId, type: 'vacancy', offerKey: event.offerKey })) {
        vacancyEventsSkippedByCooldown += 1;
        continue;
      }

      const insertedId = await createAlertEventWithDedupe({
        accommodationId,
        type: 'vacancy',
        eventKey: event.eventKey,
        offerKey: event.offerKey,
        status: 'detected',
        beforeHash: event.beforeHash,
        afterHash: event.afterHash,
        meta: toJsonValue(event.meta),
      });

      if (insertedId != null) {
        vacancyEventsInserted += 1;
        alertEventIdsToNotify.push(insertedId);
      }
    }

    for (const event of verifyResult.rejected) {
      await createAlertEventWithDedupe({
        accommodationId,
        type: 'vacancy',
        eventKey: `vacancy_rejected:${accommodationId}:${event.offerKey}:${event.afterHash}`,
        offerKey: event.offerKey,
        status: 'rejected_verify_failed',
        beforeHash: event.beforeHash,
        afterHash: event.afterHash,
        meta: toJsonValue(event.meta),
      });
    }

    for (const event of priceDropEvents) {
      if (await isInCooldown({ accommodationId, type: 'price_drop', offerKey: event.offerKey })) {
        priceDropEventsSkippedByCooldown += 1;
        continue;
      }

      const insertedId = await createAlertEventWithDedupe({
        accommodationId,
        type: 'price_drop',
        eventKey: event.eventKey,
        offerKey: event.offerKey,
        status: 'detected',
        beforeHash: event.beforeHash,
        afterHash: event.afterHash,
        meta: toJsonValue({
          offerKey: event.offerKey,
          beforePrice: event.beforePrice,
          afterPrice: event.afterPrice,
          dropRatio: event.dropRatio,
          ...event.meta,
        }),
      });

      if (insertedId != null) {
        priceDropEventsInserted += 1;
        alertEventIdsToNotify.push(insertedId);
      }
    }

    const notificationsQueued = await enqueueNotifications({
      accommodationId,
      alertEventIds: alertEventIdsToNotify,
    });

    const now = new Date();
    const latencyMs = Date.now() - pipelineStartedAt;

    // metaSearch extra에서 받은 landingUrl 저장 (첫 번째 오퍼의 hotel-level URL)
    const discoveredLandingUrl = normalized.offers.find((o) => o.landingUrl != null)?.landingUrl ?? null;

    await prisma.$transaction([
      prisma.agodaPollRun.update({
        where: { id: pollRun.id },
        data: {
          status: 'success',
          httpStatus: apiResult.httpStatus,
          latencyMs,
          polledAt: now,
          error: null,
        },
      }),
      prisma.accommodation.update({
        where: { id: accommodationId },
        data: {
          lastPolledAt: now,
          ...(vacancyEventsInserted > 0 || priceDropEventsInserted > 0 ? { lastEventAt: now } : {}),
          ...(discoveredLandingUrl ? { platformMetadata: toJsonValue({ landingUrl: discoveredLandingUrl }) } : {}),
        },
      }),
    ]);

    return {
      accommodationId,
      pollRunId: pollRun.id.toString(),
      polledAt: now.toISOString(),
      httpStatus: apiResult.httpStatus,
      latencyMs,
      snapshotsInserted: normalized.offers.length,
      vacancyEventsDetected: vacancyEvents.length,
      vacancyEventsRejectedByVerify: verifyResult.rejected.length,
      vacancyEventsInserted,
      vacancyEventsSkippedByCooldown,
      priceDropEventsDetected: priceDropEvents.length,
      priceDropEventsInserted,
      priceDropEventsSkippedByCooldown,
      notificationsQueued,
    };
  } catch (error) {
    const failedAt = new Date();
    const errorMessage = normalizeErrorMessage(error);

    await prisma.$transaction([
      prisma.agodaPollRun.update({
        where: { id: pollRun.id },
        data: {
          status: 'failed',
          latencyMs: Date.now() - pipelineStartedAt,
          polledAt: failedAt,
          error: errorMessage,
        },
      }),
      prisma.accommodation.update({
        where: { id: accommodationId },
        data: { lastPolledAt: failedAt },
      }),
    ]);

    throw error;
  }
}

function buildDueThreshold(now: Date): Date {
  const minutes = parsePositiveInteger(process.env.MOONCATCH_POLL_INTERVAL_MINUTES, DEFAULT_DUE_POLL_INTERVAL_MINUTES);
  return new Date(now.getTime() - minutes * 60 * 1000);
}

export async function findDueAccommodationIds(limit?: number): Promise<string[]> {
  const now = new Date();
  const dueThreshold = buildDueThreshold(now);
  const take = limit ?? parsePositiveInteger(process.env.MOONCATCH_DUE_POLL_LIMIT, DEFAULT_DUE_POLL_LIMIT);

  const dueAccommodations = await prisma.accommodation.findMany({
    where: {
      platform: 'AGODA',
      isActive: true,
      platformId: { not: null },
      // 체크인이 이미 지난 것은 폴링 제외
      checkIn: { gte: new Date() },
      OR: [{ lastPolledAt: null }, { lastPolledAt: { lte: dueThreshold } }],
    },
    orderBy: [{ lastPolledAt: 'asc' }, { updatedAt: 'asc' }],
    take,
    select: { id: true },
  });

  return dueAccommodations.map((a) => a.id);
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export async function pollDueAccommodationsOnce(params?: {
  limit?: number;
  concurrency?: number;
}): Promise<PollDueAccommodationsResult> {
  const now = new Date();
  const dueIds = await findDueAccommodationIds(params?.limit);
  const concurrency = Math.max(
    1,
    params?.concurrency ??
      parsePositiveInteger(process.env.MOONCATCH_DUE_POLL_CONCURRENCY, DEFAULT_DUE_POLL_CONCURRENCY),
  );

  const results: PollAccommodationResult[] = [];
  const failures: Array<{ accommodationId: string; reason: string }> = [];

  const chunks = chunkArray(dueIds, concurrency);
  for (const chunk of chunks) {
    const settled = await Promise.allSettled(chunk.map(async (id) => pollAccommodationOnce(id)));

    settled.forEach((entry, index) => {
      const accommodationId = chunk[index] ?? 'unknown';
      if (entry.status === 'fulfilled') {
        results.push(entry.value);
      } else {
        failures.push({
          accommodationId,
          reason: normalizeErrorMessage(entry.reason),
        });
      }
    });
  }

  return {
    now: now.toISOString(),
    dueCount: dueIds.length,
    processedCount: results.length + failures.length,
    successCount: results.length,
    failedCount: failures.length,
    failures,
    results,
  };
}
