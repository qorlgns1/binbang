import puppeteer from "puppeteer";
import type { CheckResult, AccommodationToCheck } from "./types";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function checkAirbnb(
  accommodation: AccommodationToCheck,
): Promise<CheckResult> {
  const { url, checkIn, checkOut, adults } = accommodation;

  const checkUrl = `${url}?check_in=${formatDate(checkIn)}&check_out=${formatDate(checkOut)}&adults=${adults}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    });

    console.log(`  🔍 Airbnb 체크 중: ${checkUrl}`);

    await page.goto(checkUrl, {
      waitUntil: "networkidle2",
      timeout: 200000,
    });

    await new Promise((r) => setTimeout(r, 3000));

    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // 1. 명확한 예약 불가 신호 먼저 확인
      const unavailablePatterns = [
        "날짜 변경",
        "Change dates",
        "선택하신 날짜는 이용이 불가능합니다.",
        "Those dates are not available.",
      ];

      for (const pattern of unavailablePatterns) {
        if (bodyText.includes(pattern)) {
          return { available: false, reason: pattern, price: null };
        }
      }

      // 2. 가격 정보 확인
      const priceMatch = bodyText.match(/₩\s*([\d,]+)/);
      const hasPrice =
        priceMatch && parseInt(priceMatch[1].replace(/,/g, "")) > 0;

      // 3. 예약 가능 신호 확인 - 가격이 있어야만 예약 가능
      if (hasPrice) {
        const availablePatterns = [
          "예약하기",
          "Reserve",
          "예약 확정 전에는 요금이 청구되지 않습니다.",
          "You won't be charged yet",
        ];

        for (const pattern of availablePatterns) {
          if (bodyText.includes(pattern)) {
            return {
              available: true,
              price: priceMatch[0],
              reason: null,
            };
          }
        }
      }

      return { available: false, reason: "가격 정보 없음", price: null };
    });

    await browser.close();

    return {
      available: result.available,
      price: result.price,
      checkUrl,
      error: null,
    };
  } catch (error) {
    if (browser) await browser.close();

    return {
      available: false,
      price: null,
      checkUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
