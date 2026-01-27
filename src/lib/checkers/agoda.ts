import puppeteer from "puppeteer";
import type { CheckResult, AccommodationToCheck } from "./types";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function checkAgoda(
  accommodation: AccommodationToCheck,
): Promise<CheckResult> {
  const { url, checkIn, checkOut, adults } = accommodation;

  const baseUrl = url.split("?")[0];
  const nights = calculateNights(checkIn, checkOut);
  const checkUrl = `${baseUrl}?checkIn=${formatDate(checkIn)}&los=${nights}&adults=${adults}&rooms=1&cid=1890020`;

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

    console.log(`  🔍 Agoda 체크 중: ${checkUrl}`);

    await page.goto(checkUrl, {
      waitUntil: "networkidle2",
      timeout: 200000,
    });

    await new Promise((r) => setTimeout(r, 5000));

    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // 1. 예약 불가 패턴 먼저 확인 (우선순위 높음)
      const unavailablePatterns = [
        "죄송합니다. 고객님이 선택한 날짜에 이 숙소의 본 사이트 잔여 객실이 없습니다.",
        "Sorry, we have no rooms at this property on your dates.",
        "날짜를 변경해 이 숙소 재검색하기",
        "Change your dates",
        "동일한 날짜로 다른 숙소 검색하기",
        "See available properties",
      ];

      for (const pattern of unavailablePatterns) {
        if (bodyText.includes(pattern)) {
          return { available: false, reason: pattern, price: null };
        }
      }

      // 2. 예약 가능 신호 확인
      const availablePatterns = ["지금 예약하기", "Book now"];

      const priceMatch = bodyText.match(/₩\s*[\d,]+|KRW\s*[\d,]+/);

      for (const pattern of availablePatterns) {
        if (bodyText.includes(pattern)) {
          return {
            available: true,
            price: priceMatch ? priceMatch[0] : null,
            reason: null,
          };
        }
      }

      return { available: false, reason: "상태 확인 불가", price: null };
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
