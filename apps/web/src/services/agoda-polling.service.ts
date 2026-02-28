import type { Prisma } from '@workspace/db';
import { prisma } from '@workspace/db';

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
  cooldownHours: number;
}): Promise<boolean> {
  const cooldownFrom = new Date(Date.now() - params.cooldownHours * 60 * 60 * 1000);

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
      // 현재 큐는 email 채널 단일 모델이며, Kakao는 dispatch 단계에서 병행 발송한다.
      // 향후 kakao-only 사용자를 지원할 때는 채널별 큐 분리가 필요하다.
      channel: 'email',
      status: 'queued',
      attempt: 0,
    })),
  });

  return created.count;
}

export async function pollAccommodationOnce(accommodationId: string): Promise<PollAccommodationResult> {
  const runtimeSettings = await getBinbangRuntimeSettings();
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
      // verify API 호출 실패 시 후보를 rejected로 처리하지 않고 스킵한다.
      // rejected로 처리하면 DB에 'rejected_verify_failed' 이벤트가 기록되어
      // 실제 verify 실패인지 API 오류인지 구분이 어려워진다.
      //
      // vacancy 후보가 있었는데 verify에 실패한 경우, 이 run을 'partial'로 마킹해
      // latestSuccessfulRun 쿼리에서 제외한다. 그래야 다음 poll 주기에서
      // 이전 baseline(스냅샷 없음 = sold out)을 다시 참조하여 vacancy를 재감지할 수 있다.
      // 'success'로 마킹하면 이 run의 스냅샷이 baseline이 되어
      // previousSnapshots.length > 0 → vacancy 감지가 영구적으로 불가능해진다.
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

    const alertEventIdsToNotify: bigint[] = [];
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

    // vacancy 후보가 있었지만 verify API가 실패해 스킵된 경우 'partial'로 마킹한다.
    // 'partial' run은 latestSuccessfulRun 쿼리(status: 'success')에 매칭되지 않으므로,
    // 다음 poll 주기에서 이전의 진짜 'success' run을 baseline으로 사용해
    // sold-out → available 전환을 다시 감지할 수 있다.
    const pollRunStatus = vacancyVerifySkipped ? 'partial' : 'success';

    await prisma.$transaction([
      prisma.agodaPollRun.update({
        where: { id: pollRun.id },
        data: {
          status: pollRunStatus,
          httpStatus: apiResult.httpStatus,
          latencyMs,
          polledAt: now,
          error: vacancyVerifySkipped ? 'vacancy verify API failed, will retry next cycle' : null,
        },
      }),
      prisma.accommodation.update({
        where: { id: accommodationId },
        data: {
          lastPolledAt: now,
          lastStatus: normalized.offers.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
          ...(vacancyEventsInserted > 0 || priceDropEventsInserted > 0 ? { lastEventAt: now } : {}),
          ...(discoveredLandingUrl
            ? {
                platformMetadata: toJsonValue({
                  ...(typeof accommodation.platformMetadata === 'object' &&
                  accommodation.platformMetadata != null &&
                  !Array.isArray(accommodation.platformMetadata)
                    ? (accommodation.platformMetadata as Record<string, unknown>)
                    : {}),
                  landingUrl: discoveredLandingUrl,
                }),
              }
            : {}),
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
      vacancyVerifySkipped,
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
        data: { lastPolledAt: failedAt, lastStatus: 'ERROR' },
      }),
    ]);

    throw error;
  }
}

function buildDueThreshold(now: Date, pollIntervalMinutes: number): Date {
  return new Date(now.getTime() - pollIntervalMinutes * 60 * 1000);
}

export async function findDueAccommodationIds(limit?: number): Promise<string[]> {
  const runtimeSettings = await getBinbangRuntimeSettings();
  const now = new Date();
  const dueThreshold = buildDueThreshold(now, runtimeSettings.pollIntervalMinutes);
  const take = limit ?? runtimeSettings.duePollLimit;

  // 체크인 당일 자정(UTC)을 기준으로 필터한다.
  // new Date()를 쓰면 당일 오전 1시에 이미 "지난 날"로 판단해 폴링이 멈추는 버그가 생긴다.
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const dueAccommodations = await prisma.accommodation.findMany({
    where: {
      platform: 'AGODA',
      isActive: true,
      platformId: { not: null },
      // 오늘 자정(UTC) 이후 체크인인 경우만 폴링 대상
      checkIn: { gte: todayStart },
      OR: [{ lastPolledAt: null }, { lastPolledAt: { lte: dueThreshold } }],
    },
    orderBy: [{ lastPolledAt: { sort: 'asc', nulls: 'first' } }, { updatedAt: 'asc' }],
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
