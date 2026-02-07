/**
 * Agoda 체커 테스트 스크립트
 * 실행: pnpm tsx scripts/test-agoda.ts
 */
import { checkAgoda } from '@/lib/checkers/agoda';
import { setupPage } from '@/lib/checkers/browser';
import { acquireBrowser, closeBrowserPool, initBrowserPool, releaseBrowser } from '@/lib/checkers/browserPool';

const TEST_ACCOMMODATION = {
  id: 'test-2',
  name: 'Oden Ivry',
  url: 'https://www.agoda.com/ko-kr/oden-ivry/hotel/ivry-sur-seine-fr.html',
  checkIn: new Date('2026-04-28'),
  checkOut: new Date('2026-05-02'), // 4박
  adults: 2,
  rooms: 1,
  platform: 'AGODA' as const,
};

// 페이지에서 data-* 속성 분석
async function analyzePageData(url: string) {
  const browser = await acquireBrowser();
  const page = await browser.newPage();
  await setupPage(page);

  console.log(`\n🔍 페이지 분석 중: ${url}\n`);

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // 여러 번 스크롤하여 콘텐츠 로딩
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise((r) => setTimeout(r, 1500));
  }
  // 위로 다시 스크롤하여 가격 섹션 확인
  await page.evaluate(() => window.scrollTo(0, 500));
  await new Promise((r) => setTimeout(r, 3000)); // 추가 대기

  const data = await page.evaluate(() => {
    const result: Record<string, unknown> = {};

    // 1. 가격 관련 속성들
    const priceAttrs = ['data-element-hotel-price-per-book', 'data-fpc-value', 'data-element-cheapest-room-price'];
    priceAttrs.forEach((attr) => {
      const el = document.querySelector(`[${attr}]`);
      if (el) result[attr] = el.getAttribute(attr);
    });

    // 2. data-testid="offer-price" 내용
    const offerPrice = document.querySelector('[data-testid="offer-price"]');
    if (offerPrice) {
      result['offer-price-text'] = (offerPrice as HTMLElement).innerText;
    }

    // 3. data-testid="room-offer-price-info" 내용
    const roomOfferPrice = document.querySelector('[data-testid="room-offer-price-info"]');
    if (roomOfferPrice) {
      result['room-offer-price-info-text'] = (roomOfferPrice as HTMLElement).innerText;
    }

    // 4. 가용성 관련
    const available = document.querySelector('[data-element-value="available"]');
    const unavailable = document.querySelector('[data-element-value="unavailable"]');
    result['available'] = !!available;
    result['unavailable'] = !!unavailable;

    // 5. 검색 조건 (adults, rooms) - SearchBox에서 추출
    const adultsEl = document.querySelector('[data-selenium="adultValue"]');
    const roomsEl = document.querySelector('[data-selenium="roomValue"]');
    if (adultsEl) result['adults'] = (adultsEl as HTMLElement).innerText;
    if (roomsEl) result['rooms'] = (roomsEl as HTMLElement).innerText;

    // 6. 체크인/체크아웃
    const checkInEl = document.querySelector('[data-selenium="checkInText"]');
    const checkOutEl = document.querySelector('[data-selenium="checkOutText"]');
    if (checkInEl) result['checkIn'] = (checkInEl as HTMLElement).innerText;
    if (checkOutEl) result['checkOut'] = (checkOutEl as HTMLElement).innerText;

    // 7. 세금 포함 가격 찾기 (1박당 총 금액)
    const allText = document.body.innerText;
    const taxMatch = allText.match(/1박당 총 금액[^\d]*([\d,]+)/);
    if (taxMatch) result['perNightTotalPrice'] = taxMatch[1];

    // 8. 추가 data-element-* 속성들
    const elements = document.querySelectorAll('[data-element-name*="price"]');
    elements.forEach((el, i) => {
      const name = el.getAttribute('data-element-name');
      const text = (el as HTMLElement).innerText?.slice(0, 100);
      result[`price-element-${i}`] = { name, text };
    });

    // 9. 모든 data-testid 중 price 관련
    const testIdElements = document.querySelectorAll('[data-testid*="price"]');
    testIdElements.forEach((el, i) => {
      const testId = el.getAttribute('data-testid');
      const text = (el as HTMLElement).innerText?.slice(0, 200);
      result[`testid-price-${i}`] = { testId, text };
    });

    // 10. data-fpc-value 모든 요소
    const fpcElements = document.querySelectorAll('[data-fpc-value]');
    fpcElements.forEach((el, i) => {
      const value = el.getAttribute('data-fpc-value');
      result[`fpc-value-${i}`] = value;
    });

    // 11. offer 관련 testid
    const offerElements = document.querySelectorAll('[data-testid*="offer"]');
    offerElements.forEach((el, i) => {
      const testId = el.getAttribute('data-testid');
      const text = (el as HTMLElement).innerText?.slice(0, 200);
      result[`offer-${i}`] = { testId, text };
    });

    // 12. room-grid 관련 요소 개수
    const roomGrids = document.querySelectorAll('[data-element-name*="room"]');
    result['room-grid-count'] = roomGrids.length;

    // 13. JSON-LD 추출 (가장 중요!)
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    const jsonLdData: unknown[] = [];
    jsonLdScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '');
        jsonLdData.push(data);
      } catch (e) {
        // 파싱 실패 무시
        console.log(e);
      }
    });
    result['json-ld'] = jsonLdData;

    // 14. 호텔 이름 (data-selenium)
    const hotelName = document.querySelector('[data-selenium="hotel-header-name"]');
    if (hotelName) result['hotel-name'] = (hotelName as HTMLElement).innerText;

    // 15. 리뷰 점수
    const reviewScore = document.querySelector('[data-selenium="hotel-header-review-score"]');
    if (reviewScore) result['review-score'] = (reviewScore as HTMLElement).innerText;

    // 16. 주소
    const address = document.querySelector('[data-selenium="hotel-address-map"]');
    if (address) result['address'] = (address as HTMLElement).innerText;

    return result;
  });

  console.log('📊 추출된 데이터:');
  console.log(JSON.stringify(data, null, 2));

  await page.close();
  await releaseBrowser(browser);

  return data;
}

async function main() {
  console.log('🧪 Agoda 페이지 데이터 분석');
  console.log('━'.repeat(50));
  console.log(`숙소: ${TEST_ACCOMMODATION.name}`);
  console.log(`체크인: ${TEST_ACCOMMODATION.checkIn.toLocaleDateString()}`);
  console.log(`체크아웃: ${TEST_ACCOMMODATION.checkOut.toLocaleDateString()}`);
  console.log(`인원: ${TEST_ACCOMMODATION.adults}명`);
  console.log('━'.repeat(50));

  try {
    console.log('\n🚀 브라우저 풀 초기화...');
    initBrowserPool(1);

    // 1. 페이지 데이터 분석
    const testUrl = `${TEST_ACCOMMODATION.url}?checkIn=2026-04-28&los=4&adults=2&rooms=1&cid=1890020`;
    await analyzePageData(testUrl);

    console.log('\n' + '━'.repeat(50));
    console.log('📋 체커 결과:');

    // 2. 실제 체커 실행
    const result = await checkAgoda(TEST_ACCOMMODATION);
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
      console.log(`  주소: ${result.metadata.streetAddress || ''}, ${result.metadata.addressLocality || ''}`);
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
