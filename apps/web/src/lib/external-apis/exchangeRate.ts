/**
 * ExchangeRate API 통합
 * 무료 티어: 1,500 calls/month
 * 문서: https://www.exchangerate-api.com/docs/overview
 */

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
  time_last_update_unix: number;
}

export interface ExchangeRateData {
  baseCurrency: string; // "USD"
  targetCurrency: string; // "KRW"
  rate: number; // 1 USD = X KRW
  lastUpdate: Date;
}

/**
 * USD → KRW 환율 조회
 */
export async function getUsdToKrwRate(): Promise<ExchangeRateData | null> {
  const apiKey = process.env.EXCHANGERATE_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    console.warn('EXCHANGERATE_API_KEY not configured');
    return null;
  }

  try {
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`ExchangeRate API error: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as ExchangeRateResponse;

    if (data.result !== 'success') {
      console.error('ExchangeRate API returned error');
      return null;
    }

    const krwRate = data.conversion_rates.KRW;
    if (!krwRate) {
      console.error('KRW rate not found in response');
      return null;
    }

    return {
      baseCurrency: 'USD',
      targetCurrency: 'KRW',
      rate: krwRate,
      lastUpdate: new Date(data.time_last_update_unix * 1000),
    };
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return null;
  }
}

/**
 * 환율 점수 계산 (0-100)
 * 현재 환율이 평균보다 낮을수록 = 여행하기 좋음 (점수 높음)
 */
export function calculateExchangeRateScore(currentRate: number): number {
  // 2026년 기준 USD/KRW 평균을 1,300원으로 가정
  const averageRate = 1300;

  // 평균 대비 차이 계산 (%)
  const diffPercent = ((currentRate - averageRate) / averageRate) * 100;

  // 평균보다 낮으면 점수 높음 (최대 100점)
  // 평균보다 높으면 점수 낮음 (최소 0점)
  let score = 50; // 기본 점수 (평균일 때)

  if (diffPercent < 0) {
    // 평균보다 저렴 (여행 유리) → 점수 증가
    score += Math.min(50, Math.abs(diffPercent) * 5);
  } else {
    // 평균보다 비쌈 (여행 불리) → 점수 감소
    score -= Math.min(50, diffPercent * 5);
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * 환율 변화 추세 분석 (간단 버전)
 * 실제로는 과거 데이터 필요하지만, MVP에서는 단순화
 */
export function getExchangeRateTrend(currentRate: number): string {
  const averageRate = 1300;

  if (currentRate < averageRate * 0.95) {
    return '매우 유리';
  } else if (currentRate < averageRate) {
    return '유리';
  } else if (currentRate > averageRate * 1.05) {
    return '불리';
  } else {
    return '보통';
  }
}
