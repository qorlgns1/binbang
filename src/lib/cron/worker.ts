import cron from "node-cron";
import prisma from "@/lib/prisma";
import { checkAccommodation } from "@/lib/checkers";
import { notifyAvailable } from "@/lib/kakao/message";
import type { AvailabilityStatus } from "@prisma/client";

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || "*/10 * * * *";
const CHECK_INTERVAL = 5000; // 숙소 간 체크 간격 (ms)

async function checkAllAccommodations() {
  console.log("\n========================================");
  console.log(`🕐 모니터링 시작: ${new Date().toLocaleString("ko-KR")}`);
  console.log("========================================\n");

  // 활성화된 모든 숙소 조회
  const accommodations = await prisma.accommodation.findMany({
    where: {
      isActive: true,
      checkIn: {
        gte: new Date(), // 체크인이 아직 안 지난 것만
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

  console.log(`📋 체크할 숙소: ${accommodations.length}개\n`);

  for (const accommodation of accommodations) {
    console.log(`📍 ${accommodation.name}`);

    const result = await checkAccommodation({
      id: accommodation.id,
      url: accommodation.url,
      checkIn: accommodation.checkIn,
      checkOut: accommodation.checkOut,
      adults: accommodation.adults,
      platform: accommodation.platform,
    });

    // 상태 결정
    let status: AvailabilityStatus;
    if (result.error) {
      status = "ERROR";
      console.log(`  ❌ 에러: ${result.error}`);
    } else if (result.available) {
      status = "AVAILABLE";
      console.log(`  ✅ 예약 가능! ${result.price ? `(${result.price})` : ""}`);
    } else {
      status = "UNAVAILABLE";
      console.log(`  ⛔ 예약 불가`);
    }

    // 로그 저장
    await prisma.checkLog.create({
      data: {
        accommodationId: accommodation.id,
        userId: accommodation.userId,
        status,
        price: result.price,
        errorMessage: result.error,
        notificationSent: false,
      },
    });

    // 상태 변경 시 알림 (이전에 불가 → 현재 가능)
    const shouldNotify =
      status === "AVAILABLE" &&
      accommodation.lastStatus !== "AVAILABLE" &&
      accommodation.user.kakaoAccessToken;

    if (shouldNotify) {
      console.log(`  📱 카카오톡 알림 전송 중...`);

      const sent = await notifyAvailable(
        accommodation.userId,
        accommodation.name,
        accommodation.checkIn,
        accommodation.checkOut,
        result.price,
        result.checkUrl,
      );

      // 알림 전송 결과 업데이트
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

    // 숙소 상태 업데이트
    await prisma.accommodation.update({
      where: { id: accommodation.id },
      data: {
        lastCheck: new Date(),
        lastStatus: status,
        lastPrice: result.price,
      },
    });

    // 다음 숙소 체크 전 대기
    await new Promise((r) => setTimeout(r, CHECK_INTERVAL));
  }

  console.log("\n✅ 모니터링 완료\n");
}

// 크론 작업 시작
console.log(`🚀 숙소 모니터링 워커 시작`);
console.log(`📅 스케줄: ${CRON_SCHEDULE}`);
console.log(`⏰ 다음 실행 대기 중...\n`);

// 시작 시 즉시 1회 실행
checkAllAccommodations();

// 크론 스케줄 등록
cron.schedule(CRON_SCHEDULE, checkAllAccommodations);

// 프로세스 종료 핸들링
process.on("SIGINT", async () => {
  console.log("\n🛑 워커 종료 중...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 워커 종료 중...");
  await prisma.$disconnect();
  process.exit(0);
});
