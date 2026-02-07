import type { AvailabilityStatus } from '@/generated/prisma/client';
import { checkAccommodation } from '@/lib/checkers';
import { parsePrice } from '@/lib/checkers/priceParser';
import { updateHeartbeat } from '@/lib/heartbeat';
import { notifyAvailable } from '@/lib/kakao/message';
import prisma from '@/lib/prisma';
import { getSettings, loadSettings } from '@/lib/settings';
import type { AccommodationWithUser } from '@/types/accommodation';

import { getCronConfig } from './config';
import { createLimiter } from './limiter';
import { determineStatus, isSameStayDates, nightsBetween, shouldSendAvailabilityNotification } from './statusUtils';

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
    console.log(`\n📍 [${accommodation.name}] 체크 시작`);

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
    await updateAccommodationStatus(accommodation.id, status, result.price);

    console.log(`  ⏱️  완료 (${durationMs}ms)`);

    return { success: status !== 'ERROR' };
  } catch (error) {
    console.error(`  💥 처리 실패:`, error);
    return { success: false };
  }
}

// ============================================
// 상태 로깅
// ============================================
function logStatus(status: AvailabilityStatus, result: { error: string | null; price: string | null }): void {
  switch (status) {
    case 'ERROR':
      console.log(`  ❌ 에러: ${result.error}`);
      break;
    case 'AVAILABLE':
      console.log(`  ✅ 예약 가능! ${result.price || ''}`);
      break;
    case 'UNAVAILABLE':
      console.log(`  ⛔ 예약 불가`);
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
  let effectiveLastStatus = accommodation.lastStatus;

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

  console.log(`  📱 카카오톡 알림 전송 중...`);

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
): Promise<void> {
  const parsed = parsePrice(price);

  await prisma.accommodation.update({
    where: { id: accommodationId },
    data: {
      lastCheck: new Date(),
      lastStatus: status,
      lastPrice: price,
      lastPriceAmount: parsed?.amount ?? null,
      lastPriceCurrency: parsed?.currency ?? null,
    },
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
    console.log('⚠️  이전 작업이 아직 실행 중입니다. 스킵합니다.');
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  // 사이클 시작 시 DB에서 동적 설정 갱신 (타임아웃, 재시도 등)
  await loadSettings().catch((err) => console.warn('⚠️ 설정 갱신 실패, 이전 캐시 사용:', err));

  const config = getCronConfig();
  const settings = getSettings();

  console.log('\n========================================');
  console.log(`🕐 모니터링 시작: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`⚙️  동시 처리: ${config.concurrency}개`);
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

    console.log(`📋 체크할 숙소: ${accommodations.length}개`);

    if (accommodations.length === 0) {
      console.log('체크할 숙소가 없습니다.\n');
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
    console.log(`\n✅ 모니터링 완료 (총 ${elapsed}초 소요)\n`);
  } catch (error) {
    console.error('모니터링 중 오류 발생:', error);
  } finally {
    isRunning = false;

    // Heartbeat: 사이클 종료
    await updateHeartbeat(false);
  }
}
