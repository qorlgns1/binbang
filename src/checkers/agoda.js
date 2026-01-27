const { launchBrowser } = require('../utils/browser');

/**
 * Agoda 숙소 예약 가능 여부 체크
 * @param {Object} accommodation - 숙소 정보
 * @returns {Object} { available: boolean, price: string|null, checkUrl: string, error: string|null }
 */
async function checkAgoda(accommodation) {
  const { url, checkIn, checkOut, adults = 2 } = accommodation;

  // URL 파라미터 구성
  const baseUrl = url.split('?')[0];
  const nights = calculateNights(checkIn, checkOut);
  const checkUrl = `${baseUrl}?checkIn=${checkIn}&los=${nights}&adults=${adults}&rooms=1&cid=1890020`;

  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();

    // User-Agent 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 언어/지역 설정
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    console.log(`  🔍 Agoda 체크 중: ${checkUrl}`);

    await page.goto(checkUrl, {
      waitUntil: 'networkidle2',
      timeout: 200000,
    });

    // 페이지 로딩 대기
    await new Promise(r => setTimeout(r, 5000));

    // 예약 가능 여부 확인
    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // 1. 예약 가능 신호 먼저 확인
      const availablePatterns = [
        '지금 예약하기',
        'Book now',
      ];

      // 가격 정보 찾기
      const priceMatch = bodyText.match(/₩\s*[\d,]+|KRW\s*[\d,]+/);

      for (const pattern of availablePatterns) {
        if (bodyText.includes(pattern)) {
          return {
            available: true,
            price: priceMatch ? priceMatch[0] : null,
          };
        }
      }

      // 2. 예약 불가 패턴 확인
      const unavailablePatterns = [
        '죄송합니다. 고객님이 선택한 날짜에 이 숙소의 본 사이트 잔여 객실이 없습니다.',
        'Sorry, we have no rooms at this property on your dates.',
        '날짜를 변경해 이 숙소 재검색하기',
        'Change your dates',
        '동일한 날짜로 다른 숙소 검색하기',
        'See available properties',
      ];

      for (const pattern of unavailablePatterns) {
        if (bodyText.includes(pattern)) {
          return { available: false, reason: pattern };
        }
      }

      return { available: false, reason: '상태 확인 불가' };
    });

    await browser.close();

    return {
      available: result.available,
      price: result.price || null,
      checkUrl,
      error: null,
    };
  } catch (error) {
    if (browser) await browser.close();

    return {
      available: false,
      price: null,
      checkUrl,
      error: error.message,
    };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * 숙박 일수 계산
 */
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = { checkAgoda };
