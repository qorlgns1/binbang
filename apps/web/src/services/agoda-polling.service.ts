import {
  Accommodation,
  AgodaAlertEvent,
  AgodaNotification,
  AgodaPollRun,
  AgodaRoomSnapshot,
  getDataSource,
} from '@workspace/db';

import { normalizeAgodaSearchResponse } from '@/lib/agoda/normalize';
import { searchAgodaAvailability } from '@/lib/agoda/searchClient';
import { detectPriceDropEvents, detectVacancyEvents } from '@/services/agoda-detector.service';
import { getBinbangRuntimeSettings } from '@/services/binbang-runtime-settings.service';

const MAX_ERROR_LENGTH = 1000;

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
  vacancyVerifySkipped: boolean;
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

function buildSnapshotSeed(
  rows: Array<{
    propertyId: string;
    roomId: string;
    ratePlanId: string;
    remainingRooms: number | null;
    totalInclusive: number | null;
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
  const message = 'message' in error ? String((error as { message: unknown }).message) : '';
  return message.includes('ORA-00001');
}

async function isInCooldown(params: {
  accommodationId: string;
  type: 'vacancy' | 'price_drop' | 'vacancy_proxy';
  offerKey: string;
  cooldownHours: number;
}): Promise<boolean> {
  const cooldownFrom = new Date(Date.now() - params.cooldownHours * 60 * 60 * 1000);
  const ds = await getDataSource();

  const existing = await ds.getRepository(AgodaAlertEvent).findOne({
    where: {
      accommodationId: params.accommodationId,
      type: params.type,
      offerKey: params.offerKey,
      status: 'detected',
    },
    select: { id: true, detectedAt: true },
    order: { detectedAt: 'DESC' },
  });

  if (!existing) return false;
  return existing.detectedAt >= cooldownFrom;
}

async function createAlertEventWithDedupe(params: {
  accommodationId: string;
  type: 'vacancy' | 'price_drop' | 'vacancy_proxy';
  eventKey: string;
  offerKey?: string;
  status: string;
  beforeHash: string | null;
  afterHash: string | null;
  meta: object;
}): Promise<number | null> {
  try {
    const ds = await getDataSource();
    const repo = ds.getRepository(AgodaAlertEvent);
    const entity = repo.create({
      accommodationId: params.accommodationId,
      type: params.type,
      eventKey: params.eventKey,
      offerKey: params.offerKey ?? null,
      status: params.status,
      beforeHash: params.beforeHash,
      afterHash: params.afterHash,
      meta: params.meta,
    });
    await repo.save(entity);
    return entity.id;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return null;
    }
    throw error;
  }
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

  if (verifyOffers.length > 0) {
    return { confirmed: params.candidates, rejected: [] };
  }
  return { confirmed: [], rejected: params.candidates };
}

async function enqueueNotifications(params: { accommodationId: string; alertEventIds: number[] }): Promise<number> {
  if (params.alertEventIds.length === 0) return 0;
  const ds = await getDataSource();
  const repo = ds.getRepository(AgodaNotification);

  const entities = params.alertEventIds.map((alertEventId) =>
    repo.create({
      accommodationId: params.accommodationId,
      alertEventId,
      channel: 'email',
      status: 'queued',
      attempt: 0,
    }),
  );
  await repo.save(entities);
  return entities.length;
}

export async function pollAccommodationOnce(accommodationId: string): Promise<PollAccommodationResult> {
  const ds = await getDataSource();
  const runtimeSettings = await getBinbangRuntimeSettings();
  const accommodation = await ds.getRepository(Accommodation).findOne({
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
      priceDropThreshold: true,
      platformMetadata: true,
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

  const pollRunRepo = ds.getRepository(AgodaPollRun);
  const pollRun = pollRunRepo.create({ accommodationId, status: 'started' });
  await pollRunRepo.save(pollRun);

  const pipelineStartedAt = Date.now();

  try {
    const latestSuccessfulRun = await pollRunRepo.findOne({
      where: { accommodationId, status: 'success' },
      order: { polledAt: 'DESC' },
      select: { id: true },
    });

    const previousRows = latestSuccessfulRun
      ? await ds.getRepository(AgodaRoomSnapshot).find({
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
      const snapshotRepo = ds.getRepository(AgodaRoomSnapshot);
      const snapshots = normalized.offers.map((offer) =>
        snapshotRepo.create({
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
          raw: offer.raw as object,
        }),
      );
      await snapshotRepo.save(snapshots);
    }

    const vacancyEvents = detectVacancyEvents({
      accommodationId,
      previousSnapshots,
      currentOffers: normalized.offers,
      hasBaseline: latestSuccessfulRun != null,
    });

    let verifyResult: Awaited<ReturnType<typeof verifyVacancyCandidates>>;
    let vacancyVerifySkipped = false;
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
    } catch (verifyError) {
      console.warn(
        '[polling] vacancy verify API failed, skipping candidates:',
        verifyError instanceof Error ? verifyError.message : String(verifyError),
      );
      verifyResult = { confirmed: [], rejected: [] };
      vacancyVerifySkipped = vacancyEvents.length > 0;
    }

    const priceDropEvents = detectPriceDropEvents({
      accommodationId,
      previousSnapshots,
      currentOffers: normalized.offers,
      minDropRatio:
        accommodation.priceDropThreshold != null
          ? Number(accommodation.priceDropThreshold)
          : runtimeSettings.priceDropThreshold,
    });

    const alertEventIdsToNotify: number[] = [];
    let vacancyEventsInserted = 0;
    let vacancyEventsSkippedByCooldown = 0;
    let priceDropEventsInserted = 0;
    let priceDropEventsSkippedByCooldown = 0;

    for (const event of verifyResult.confirmed) {
      if (
        await isInCooldown({
          accommodationId,
          type: 'vacancy',
          offerKey: event.offerKey,
          cooldownHours: runtimeSettings.vacancyCooldownHours,
        })
      ) {
        vacancyEventsSkippedByCooldown += 1;
        continue;
      }

      const insertedId = await createAlertEventWithDedupe({
        accommodationId,
        type: 'vacancy',
        eventKey: `vacancy:${accommodationId}:${event.offerKey}:${pollRun.id.toString()}`,
        offerKey: event.offerKey,
        status: 'detected',
        beforeHash: event.beforeHash,
        afterHash: event.afterHash,
        meta: event.meta as object,
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
        meta: event.meta as object,
      });
    }

    for (const event of priceDropEvents) {
      if (
        await isInCooldown({
          accommodationId,
          type: 'price_drop',
          offerKey: event.offerKey,
          cooldownHours: runtimeSettings.priceDropCooldownHours,
        })
      ) {
        priceDropEventsSkippedByCooldown += 1;
        continue;
      }

      const insertedId = await createAlertEventWithDedupe({
        accommodationId,
        type: 'price_drop',
        eventKey: `price_drop:${accommodationId}:${event.offerKey}:${pollRun.id.toString()}`,
        offerKey: event.offerKey,
        status: 'detected',
        beforeHash: event.beforeHash,
        afterHash: event.afterHash,
        meta: {
          offerKey: event.offerKey,
          beforePrice: event.beforePrice,
          afterPrice: event.afterPrice,
          dropRatio: event.dropRatio,
          ...event.meta,
        } as object,
      });

      if (insertedId != null) {
        priceDropEventsInserted += 1;
        alertEventIdsToNotify.push(insertedId);
      }
    }

    let notificationsQueued = 0;
    try {
      notificationsQueued = await enqueueNotifications({
        accommodationId,
        alertEventIds: alertEventIdsToNotify,
      });
    } catch (err) {
      console.warn('[agoda-polling] enqueueNotifications 실패, 다음 dispatch 주기에서 재처리됩니다:', err);
    }

    const now = new Date();
    const latencyMs = Date.now() - pipelineStartedAt;

    const discoveredLandingUrl = normalized.offers.find((o) => o.landingUrl != null)?.landingUrl ?? null;
    const pollRunStatus = vacancyVerifySkipped ? 'partial' : 'success';

    await ds.transaction(async (manager) => {
      await manager.getRepository(AgodaPollRun).update(
        { id: pollRun.id },
        {
          status: pollRunStatus,
          httpStatus: apiResult.httpStatus,
          latencyMs,
          polledAt: now,
          error: vacancyVerifySkipped ? 'vacancy verify API failed, will retry next cycle' : null,
        },
      );

      await manager.getRepository(Accommodation).update(
        { id: accommodationId },
        {
          lastPolledAt: now,
          lastStatus: normalized.offers.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
          ...(vacancyEventsInserted > 0 || priceDropEventsInserted > 0 ? { lastEventAt: now } : {}),
          ...(discoveredLandingUrl
            ? {
                platformMetadata: {
                  ...(typeof accommodation.platformMetadata === 'object' &&
                  accommodation.platformMetadata != null &&
                  !Array.isArray(accommodation.platformMetadata)
                    ? (accommodation.platformMetadata as Record<string, unknown>)
                    : {}),
                  landingUrl: discoveredLandingUrl,
                } as object,
              }
            : {}),
        },
      );
    });

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
      vacancyVerifySkipped,
      priceDropEventsDetected: priceDropEvents.length,
      priceDropEventsInserted,
      priceDropEventsSkippedByCooldown,
      notificationsQueued,
    };
  } catch (error) {
    const failedAt = new Date();
    const errorMessage = normalizeErrorMessage(error);

    await ds.transaction(async (manager) => {
      await manager.getRepository(AgodaPollRun).update(
        { id: pollRun.id },
        {
          status: 'failed',
          latencyMs: Date.now() - pipelineStartedAt,
          polledAt: failedAt,
          error: errorMessage,
        },
      );
      await manager
        .getRepository(Accommodation)
        .update({ id: accommodationId }, { lastPolledAt: failedAt, lastStatus: 'ERROR' });
    });

    throw error;
  }
}

function buildDueThreshold(now: Date, pollIntervalMinutes: number): Date {
  return new Date(now.getTime() - pollIntervalMinutes * 60 * 1000);
}

export async function findDueAccommodationIds(limit?: number): Promise<string[]> {
  const ds = await getDataSource();
  const runtimeSettings = await getBinbangRuntimeSettings();
  const now = new Date();
  const dueThreshold = buildDueThreshold(now, runtimeSettings.pollIntervalMinutes);
  const take = limit ?? runtimeSettings.duePollLimit;

  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const dueAccommodations = await ds
    .getRepository(Accommodation)
    .createQueryBuilder('a')
    .select(['a.id'])
    .where('a.platform = :platform', { platform: 'AGODA' })
    .andWhere('a.isActive = 1')
    .andWhere('a.platformId IS NOT NULL')
    .andWhere('a.checkIn >= :todayStart', { todayStart })
    .andWhere('(a.lastPolledAt IS NULL OR a.lastPolledAt <= :dueThreshold)', { dueThreshold })
    .orderBy('a.lastPolledAt', 'ASC', 'NULLS FIRST')
    .addOrderBy('a.updatedAt', 'ASC')
    .take(take)
    .getMany();

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
  const runtimeSettings = await getBinbangRuntimeSettings();
  const now = new Date();
  const dueIds = await findDueAccommodationIds(params?.limit);
  const concurrency = Math.max(1, params?.concurrency ?? runtimeSettings.duePollConcurrency);

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
