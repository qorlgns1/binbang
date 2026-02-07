/**
 * Airbnb 체커 테스트 스크립트
 * 실행: pnpm tsx scripts/test-airbnb-analyze.ts
 */
import { checkAirbnb } from '@/lib/checkers/airbnb';
import { closeBrowserPool, initBrowserPool } from '@/lib/checkers/browserPool';

const TEST_ACCOMMODATION = {
  id: 'test-airbnb-3',
  name: '에어비앤비 테스트 숙소',
  url: 'https://www.airbnb.co.kr/rooms/1591167819045267522',
  checkIn: new Date('2026-08-15'),
  checkOut: new Date('2026-08-18'),
  adults: 1,
  platform: 'AIRBNB' as const,
};

async function main() {
  console.log('🧪 Airbnb 체커 테스트');
  console.log('━'.repeat(50));

  try {
    console.log('\n🚀 브라우저 풀 초기화...');
    initBrowserPool(1);

    // 체커 실행
    console.log('\n📋 체커 결과:');
    const result = await checkAirbnb(TEST_ACCOMMODATION);
    console.log(`  예약 가능: ${result.available ? '✅ 예' : '❌ 아니오'}`);
    console.log(`  가격: ${result.price || 'N/A'}`);
    if (result.error) {
      console.log(`  에러: ${result.error}`);
    }
    if (result.metadata) {
      console.log('\n📦 메타데이터:');
      console.log(`  플랫폼ID: ${result.metadata.platformId || 'N/A'}`);
      console.log(`  숙소명: ${result.metadata.platformName || 'N/A'}`);
      console.log(`  평점: ${result.metadata.ratingValue || 'N/A'} (${result.metadata.reviewCount || 0}개 리뷰)`);
      console.log(`  좌표: ${result.metadata.latitude}, ${result.metadata.longitude}`);
    }
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  } finally {
    console.log('\n🔒 브라우저 풀 종료...');
    await closeBrowserPool();
  }

  process.exit(0);
}

main();
