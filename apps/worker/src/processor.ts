import type { AvailabilityStatus, Accommodation, User } from '@workspace/db';
import { prisma } from '@workspace/db';
import { parsePrice, type AccommodationMetadata } from '@workspace/shared';
import {
  checkAccommodation,
  updateHeartbeat,
  notifyAvailable,
  getSettings,
  loadSettings,
} from '@workspace/shared/worker';

import { getCronConfig } from './config';
import { createLimiter } from './limiter';
import { determineStatus, isSameStayDates, nightsBetween, shouldSendAvailabilityNotification } from './statusUtils';

// ============================================
// Types
// ============================================
type AccommodationWithUser = Accommodation & {
  user: Pick<User, 'id' | 'kakaoAccessToken'>;
};

// ============================================
// 상태 관리
// ============================================
let isRunning = false;

export function isProcessing(): boolean {
  return isRunning;
}

// ============================================
// 단일 숙소 처리
// ============================================
async function processAccommodation(
  accommodation: AccommodationWithUser,
  cycleId: string,
): Promise<{ success: boolean }> {
  const startTime = Date.now();

  try {
    console.log(`\n[${accommodation.name}] Check started`);

    const result = await checkAccommodation({
      id: accommodation.id,
      url: accommodation.url,
      checkIn: accommodation.checkIn,
      checkOut: accommodation.checkOut,
      adults: accommodation.adults,
      platform: accommodation.platform,
    });

    const status = determineStatus(result);
    logStatus(status, result);

    const durationMs = Date.now() - startTime;

    await saveCheckLog(accommodation, status, result, {
      cycleId,
      durationMs,
      retryCount: result.retryCount,
      previousStatus: accommodation.lastStatus,
    });
    await sendNotificationIfNeeded(accommodation, status, result);
    await updateAccommodationStatus(accommodation.id, status, result.price, result.metadata);

    console.log(`  Done (${durationMs}ms)`);

    return { success: status !== 'ERROR' };
  } catch (error) {
    console.error(`  Processing failed:`, error);
    return { success: false };
  }
}

// ============================================
// 상태 로깅
// ============================================
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

// ============================================
// 체크 로그 저장
// ============================================
async function saveCheckLog(
  accommodation: AccommodationWithUser,
  status: AvailabilityStatus,
  result: { price: string | null; error: string | null },
  extra: {
    cycleId: string;
    durationMs: number;
    retryCount: number;
    previousStatus: AvailabilityStatus | null;
  },
): Promise<void> {
  const parsed = parsePrice(result.price);
  const nights = nightsBetween(accommodation.checkIn, accommodation.checkOut);
  const pricePerNight = parsed ? Math.round(parsed.amount / nights) : null;

  await prisma.checkLog.create({
    data: {
      accommodationId: accommodation.id,
      userId: accommodation.user.id,
      status,
      price: result.price,
      priceAmount: parsed?.amount ?? null,
      priceCurrency: parsed?.currency ?? null,
      errorMessage: result.error,
      notificationSent: false,
      checkIn: accommodation.checkIn,
      checkOut: accommodation.checkOut,
      pricePerNight,
      cycleId: extra.cycleId,
      durationMs: extra.durationMs,
      retryCount: extra.retryCount,
      previousStatus: extra.previousStatus,
    },
  });
}

// ============================================
// 알림 전송
// ============================================
async function sendNotificationIfNeeded(
  accommodation: AccommodationWithUser,
  status: AvailabilityStatus,
  result: { price: string | null; checkUrl: string },
): Promise<void> {
  // 일정이 변경된 경우 lastStatus를 무효화하여 새 일정의 첫 체크로 취급
  let effectiveLastStatus: AvailabilityStatus | null = accommodation.lastStatus;

  const lastLog = await prisma.checkLog.findFirst({
    where: { accommodationId: accommodation.id, checkIn: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { checkIn: true, checkOut: true },
    skip: 1, // 방금 생성한 로그를 건너뜀
  });

  if (lastLog?.checkIn && lastLog?.checkOut) {
    const datesChanged = !isSameStayDates(
      { checkIn: accommodation.checkIn, checkOut: accommodation.checkOut },
      { checkIn: lastLog.checkIn, checkOut: lastLog.checkOut },
    );
    if (datesChanged) {
      effectiveLastStatus = null;
    }
  }

  const shouldNotify = shouldSendAvailabilityNotification(
    status,
    effectiveLastStatus,
    Boolean(accommodation.user.kakaoAccessToken),
  );

  if (!shouldNotify) return;

  console.log(`  Sending Kakao notification...`);

  const sent = await notifyAvailable(
    accommodation.user.id,
    accommodation.name,
    accommodation.checkIn,
    accommodation.checkOut,
    result.price,
    result.checkUrl,
  );

  if (sent) {
    await prisma.checkLog.updateMany({
      where: {
        accommodationId: accommodation.id,
        notificationSent: false,
      },
      data: {
        notificationSent: true,
      },
    });
  }
}

// ============================================
// 숙소 상태 업데이트
// ============================================
async function updateAccommodationStatus(
  accommodationId: string,
  status: AvailabilityStatus,
  price: string | null,
  metadata?: AccommodationMetadata,
): Promise<void> {
  const parsed = parsePrice(price);

  // 기본 업데이트 데이터
  const updateData: Record<string, unknown> = {
    lastCheck: new Date(),
    lastStatus: status,
    lastPrice: price,
    lastPriceAmount: parsed?.amount ?? null,
    lastPriceCurrency: parsed?.currency ?? null,
  };

  // 메타데이터가 있으면 추가 (첫 체크 시 또는 정보 변경 시)
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
  });
}

// ============================================
// 모니터링 대상 조회
// ============================================
async function getActiveAccommodations(): Promise<AccommodationWithUser[]> {
  return prisma.accommodation.findMany({
    where: {
      isActive: true,
      checkIn: {
        gte: new Date(),
      },
    },
    include: {
      user: {
        select: {
          id: true,
          kakaoAccessToken: true,
        },
      },
    },
  });
}

// ============================================
// 메인 체크 함수
// ============================================
export async function checkAllAccommodations(): Promise<void> {
  if (isRunning) {
    console.log('Previous job still running. Skipping.');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  // 사이클 시작 시 DB에서 동적 설정 갱신 (타임아웃, 재시도 등)
  await loadSettings().catch((err) => console.warn('Settings refresh failed, using cache:', err));

  const config = getCronConfig();
  const settings = getSettings();

  console.log('\n========================================');
  console.log(`Monitoring started: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`Concurrency: ${config.concurrency}`);
  console.log('========================================');

  // Heartbeat: 사이클 시작
  await updateHeartbeat(true);

  let cycleId: string | null = null;

  try {
    // CheckCycle 생성 (설정 스냅샷 포함)
    const cycle = await prisma.checkCycle.create({
      data: {
        startedAt: new Date(startTime),
        concurrency: config.concurrency,
        browserPoolSize: config.browserPoolSize,
        navigationTimeoutMs: settings.browser.navigationTimeoutMs,
        contentWaitMs: settings.browser.contentWaitMs,
        maxRetries: settings.checker.maxRetries,
      },
    });
    cycleId = cycle.id;

    const accommodations = await getActiveAccommodations();

    console.log(`Accommodations to check: ${accommodations.length}`);

    if (accommodations.length === 0) {
      console.log('No accommodations to check.\n');
      return;
    }

    const limit = createLimiter(config.concurrency);

    const results = await Promise.all(
      accommodations.map((accommodation) => limit(() => processAccommodation(accommodation, cycleId as string))),
    );

    const durationMs = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.length - successCount;

    // CheckCycle 완료 업데이트
    await prisma.checkCycle.update({
      where: { id: cycleId },
      data: {
        completedAt: new Date(),
        durationMs,
        totalCount: results.length,
        successCount,
        errorCount,
      },
    });

    const elapsed = Math.round(durationMs / 1000);
    console.log(`\nMonitoring completed (${elapsed}s)\n`);
  } catch (error) {
    console.error('Monitoring error:', error);
  } finally {
    isRunning = false;

    // Heartbeat: 사이클 종료
    await updateHeartbeat(false);
  }
}
