const cron = require('node-cron');
const config = require('./config');
const { checkAccommodation } = require('./checkers');
const { notifyAvailable, sendKakaoMessage } = require('./notifier');

// 이전 상태 저장 (중복 알림 방지)
const previousStatus = new Map();

/**
 * 모든 숙소 체크
 */
async function checkAllAccommodations() {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log(`\n========================================`);
  console.log(`🕐 체크 시작: ${now}`);
  console.log(`========================================`);

  for (const accommodation of config.accommodations) {
    try {
      console.log(`\n📍 ${accommodation.name}`);

      const result = await checkAccommodation(accommodation);

      if (result.error) {
        console.log(`  ❌ 오류: ${result.error}`);
        continue;
      }

      const prevAvailable = previousStatus.get(accommodation.url + accommodation.checkIn + accommodation.checkOut);
      console.log("prevAvailable = ", prevAvailable);
      console.log("result = ", result);

      if (result.available) {
        console.log(`  ✅ 예약 가능! ${result.price ? `(${result.price})` : ''}`);

        // 이전에 불가능했다가 가능해진 경우에만 알림
        if (prevAvailable !== true) {
          console.log(`  📱 카카오톡 알림 전송 중...`);
          await notifyAvailable(accommodation, result);
        }
      } else {
        console.log(`  ⛔ 예약 불가`);
      }

      previousStatus.set(accommodation.url + accommodation.checkIn + accommodation.checkOut, result.available);

      // 다음 체크 전 대기
      if (config.accommodations.indexOf(accommodation) < config.accommodations.length - 1) {
        await sleep(config.checkInterval);
      }
    } catch (error) {
      console.error(`  ❌ 체크 실패: ${error.message}`);
    }
  }

  console.log(`\n✅ 체크 완료. 다음 체크까지 대기...\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 스케줄러 시작
 */
async function startMonitoring() {
  console.log('========================================');
  console.log('🏨 숙소 예약 모니터링 시작');
  console.log('========================================');
  console.log(`\n모니터링 대상:`);
  config.accommodations.forEach((acc, i) => {
    console.log(`  ${i + 1}. ${acc.name} (${acc.platform})`);
    console.log(`     ${acc.checkIn} ~ ${acc.checkOut}`);
  });
  console.log(`\n스케줄: ${config.schedule}`);
  console.log('');

  // 시작 알림
  await sendKakaoMessage(
    '모니터링 시작 🚀',
    `${config.accommodations.length}개 숙소를 모니터링합니다.\n\n30분마다 예약 가능 여부를 체크합니다.`,
    '설정 확인',
    'https://www.airbnb.co.kr'
  );

  // 즉시 한 번 체크
  await checkAllAccommodations();

  // 크론 스케줄 등록
  cron.schedule(config.schedule, checkAllAccommodations);

  console.log('⏰ 스케줄러가 실행 중입니다. Ctrl+C로 종료할 수 있습니다.\n');
}

// 실행
startMonitoring().catch(console.error);
