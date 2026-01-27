const { launchBrowser } = require('../utils/browser');

/**
 * Airbnb 숙소 예약 가능 여부 체크
 * @param {Object} accommodation - 숙소 정보
 * @returns {Object} { available: boolean, price: string|null, checkUrl: string, error: string|null }
 */
async function checkAirbnb(accommodation) {
  const { url, checkIn, checkOut, adults = 2 } = accommodation;

  // URL 파라미터 구성
  const checkUrl = `${url}?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`;

  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();

    // User-Agent 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // 언어 설정
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    console.log(`  🔍 Airbnb 체크 중: ${checkUrl}`);

    await page.goto(checkUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // 페이지 로딩 대기
    await new Promise(r => setTimeout(r, 3000));

    // 예약 버튼 또는 가격 정보 확인
    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // 1. 예약 가능 신호 먼저 확인 (우선순위 높음)
      const availablePatterns = [
        '예약하기',
        'Reserve',
        "예약 확정 전에는 요금이 청구되지 않습니다.",
        "You won't be charged yet",
      ];

      for (const pattern of availablePatterns) {
        if (bodyText.includes(pattern)) {
          const priceMatch = bodyText.match(/₩[\d,]+/);
          return {
            available: true,
            price: priceMatch ? priceMatch[0] : null,
          };
        }
      }

      // 2. 명확한 예약 불가 신호 확인
      const unavailablePatterns = [
        '날짜 변경',
        'Change dates',
        '선택하신 날짜는 이용이 불가능합니다.',
        'Those dates are not available.',
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

module.exports = { checkAirbnb };
