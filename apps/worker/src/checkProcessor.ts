import type { AvailabilityStatus } from '@workspace/db';
import { prisma } from '@workspace/db';
import { type AccommodationMetadata, parsePrice } from '@workspace/shared';
import { type CheckerRuntimeConfig, checkAccommodation } from '@workspace/worker-shared/browser';
import type { CheckJobPayload } from '@workspace/worker-shared/jobs';
import {
  createConditionMetEvent,
  getPlatformSelectors,
  getSettings,
  notifyAvailable,
  updateHeartbeat,
  type Job,
} from '@workspace/worker-shared/runtime';

import { determineStatus, isSameStayDates, nightsBetween, shouldSendAvailabilityNotification } from './statusUtils';

export async function processCheck(job: Job): Promise<void> {
  const data = job.data as CheckJobPayload;
  const startTime = Date.now();

  try {
    console.log(`\n[${data.name}] Check started`);

    const settings = getSettings();
    const runtimeConfig: CheckerRuntimeConfig = {
      maxRetries: settings.checker.maxRetries,
      navigationTimeoutMs: settings.browser.navigationTimeoutMs,
      contentWaitMs: settings.browser.contentWaitMs,
      patternRetryMs: settings.browser.patternRetryMs,
      retryDelayMs: settings.checker.retryDelayMs,
      blockResourceTypes: settings.checker.blockResourceTypes,
      captureScreenshot: !!data.caseId,
    };

    const selectorCache = getPlatformSelectors(data.platform);

    const result = await checkAccommodation(
      {
        id: data.accommodationId,
        url: data.url,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        adults: data.adults,
        platform: data.platform,
      },
      { runtimeConfig, selectorCache },
    );

    const status = determineStatus(result);
    logStatus(status, result);

    const durationMs = Date.now() - startTime;

    const checkLogId = await saveCheckLog(data, status, result, {
      durationMs,
      retryCount: result.retryCount,
      previousStatus: data.lastStatus,
    });

    // Case-linked 모니터링에서 AVAILABLE 감지 시 증거 생성
    if (data.caseId && status === 'AVAILABLE') {
      await createConditionMetEvent({
        caseId: data.caseId,
        checkLogId,
        evidenceSnapshot: {
          checkUrl: result.checkUrl,
          platform: data.platform,
          status,
          price: result.price,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          conditionDefinition: data.conditionDefinition ?? null,
        },
        screenshotBase64: result.screenshotBase64 ?? null,
        capturedAt: new Date(),
      });
      console.log(`  Evidence captured for case ${data.caseId}`);
    }

    await sendNotificationIfNeeded(data, status, result);
    await updateAccommodationStatus(data.accommodationId, status, result.price, result.metadata);

    console.log(`  Done (${durationMs}ms)`);

    // Atomically update cycle counters and finalize if complete
    await finalizeCycleCounter(data.cycleId, status !== 'ERROR');
  } catch (error) {
    console.error(`  Processing failed:`, error);

    // Update cycle counter on failure
    await finalizeCycleCounter(data.cycleId, false).catch((): void => {});
  }
}

async function finalizeCycleCounter(cycleId: string, success: boolean): Promise<void> {
  await prisma.$transaction(async (tx): Promise<void> => {
    const updatedCycle = await tx.checkCycle.update({
      where: { id: cycleId },
      data: success ? { successCount: { increment: 1 } } : { errorCount: { increment: 1 } },
      select: { successCount: true, errorCount: true, totalCount: true, completedAt: true, startedAt: true },
    });

    const completedCount = (updatedCycle.successCount ?? 0) + (updatedCycle.errorCount ?? 0);
    if (updatedCycle.totalCount && completedCount >= updatedCycle.totalCount && !updatedCycle.completedAt) {
      const cycleDurationMs = Date.now() - new Date(updatedCycle.startedAt).getTime();
      await tx.checkCycle.update({
        where: { id: cycleId },
        data: { completedAt: new Date(), durationMs: cycleDurationMs },
        select: { id: true },
      });

      await updateHeartbeat(false);
      console.log(`\nMonitoring completed (${Math.round(cycleDurationMs / 1000)}s)\n`);
    }
  });
}

function logStatus(status: AvailabilityStatus, result: { error: string | null; price: string | null }): void {
  switch (status) {
    case 'ERROR':
      console.log(`  Error: ${result.error}`);
      break;
    case 'AVAILABLE':
      console.log(`  Available! ${result.price || ''}`);
      break;
    case 'UNAVAILABLE':
      console.log(`  Unavailable`);
      break;
  }
}

async function saveCheckLog(
  data: CheckJobPayload,
  status: AvailabilityStatus,
  result: { price: string | null; error: string | null },
  extra: {
    durationMs: number;
    retryCount: number;
    previousStatus: AvailabilityStatus | null;
  },
): Promise<string> {
  const parsed = parsePrice(result.price);
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  const nights = nightsBetween(checkIn, checkOut);
  const pricePerNight = parsed ? Math.round(parsed.amount / nights) : null;

  const log = await prisma.checkLog.create({
    data: {
      accommodationId: data.accommodationId,
      userId: data.userId,
      status,
      price: result.price,
      priceAmount: parsed?.amount ?? null,
      priceCurrency: parsed?.currency ?? null,
      errorMessage: result.error,
      notificationSent: false,
      checkIn,
      checkOut,
      pricePerNight,
      cycleId: data.cycleId,
      durationMs: extra.durationMs,
      retryCount: extra.retryCount,
      previousStatus: extra.previousStatus,
    },
    select: { id: true },
  });

  return log.id;
}

async function sendNotificationIfNeeded(
  data: CheckJobPayload,
  status: AvailabilityStatus,
  result: { price: string | null; checkUrl: string },
): Promise<void> {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);

  let effectiveLastStatus: AvailabilityStatus | null = data.lastStatus;

  const lastLog = await prisma.checkLog.findFirst({
    where: { accommodationId: data.accommodationId, checkIn: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { checkIn: true, checkOut: true },
    skip: 1,
  });

  if (lastLog?.checkIn && lastLog?.checkOut) {
    const datesChanged = !isSameStayDates(
      { checkIn, checkOut },
      { checkIn: lastLog.checkIn, checkOut: lastLog.checkOut },
    );
    if (datesChanged) {
      effectiveLastStatus = null;
    }
  }

  const shouldNotify = shouldSendAvailabilityNotification(status, effectiveLastStatus, Boolean(data.kakaoAccessToken));

  if (!shouldNotify) return;

  console.log(`  Sending Kakao notification...`);

  const sent = await notifyAvailable(data.userId, data.name, checkIn, checkOut, result.price, result.checkUrl);

  if (sent) {
    await prisma.checkLog.updateMany({
      where: {
        accommodationId: data.accommodationId,
        notificationSent: false,
      },
      data: {
        notificationSent: true,
      },
    });
  }
}

async function updateAccommodationStatus(
  accommodationId: string,
  status: AvailabilityStatus,
  price: string | null,
  metadata?: AccommodationMetadata,
): Promise<void> {
  const parsed = parsePrice(price);

  const updateData: Record<string, unknown> = {
    lastCheck: new Date(),
    lastStatus: status,
    lastPrice: price,
    lastPriceAmount: parsed?.amount ?? null,
    lastPriceCurrency: parsed?.currency ?? null,
  };

  if (metadata && Object.keys(metadata).length > 0) {
    if (metadata.platformId) updateData.platformId = metadata.platformId;
    if (metadata.platformName) updateData.platformName = metadata.platformName;
    if (metadata.platformImage) updateData.platformImage = metadata.platformImage;
    if (metadata.platformDescription) updateData.platformDescription = metadata.platformDescription;
    if (metadata.addressCountry) updateData.addressCountry = metadata.addressCountry;
    if (metadata.addressRegion) updateData.addressRegion = metadata.addressRegion;
    if (metadata.addressLocality) updateData.addressLocality = metadata.addressLocality;
    if (metadata.postalCode) updateData.postalCode = metadata.postalCode;
    if (metadata.streetAddress) updateData.streetAddress = metadata.streetAddress;
    if (metadata.ratingValue !== undefined) updateData.ratingValue = metadata.ratingValue;
    if (metadata.reviewCount !== undefined) updateData.reviewCount = metadata.reviewCount;
    if (metadata.latitude !== undefined) updateData.latitude = metadata.latitude;
    if (metadata.longitude !== undefined) updateData.longitude = metadata.longitude;
    if (metadata.rawJsonLd) updateData.platformMetadata = metadata.rawJsonLd;
  }

  await prisma.accommodation.update({
    where: { id: accommodationId },
    data: updateData,
    select: { id: true },
  });
}
