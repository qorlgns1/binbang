/**
 * 여행 점수 계산 서비스
 * 무료 API 조합으로 여행 최적 타이밍 점수 산출
 */

import { calculateWeatherScore, getWeatherForDate, type WeatherData } from '@/lib/external-apis/weather';
import {
  calculateExchangeRateScore,
  getExchangeRateTrend,
  getUsdToKrwRate,
  type ExchangeRateData,
} from '@/lib/external-apis/exchangeRate';

export interface TravelScoreInput {
  destination: string; // 목적지 이름
  latitude: number;
  longitude: number;
  checkInDate: string; // YYYY-MM-DD
}

export interface TravelScoreResult {
  success: boolean;
  overallScore: number; // 종합 점수 (0-100)
  breakdown: {
    weather: {
      score: number;
      data: WeatherData | null;
      error?: string; // 날씨 API 에러 상세
    };
    exchangeRate: {
      score: number;
      data: ExchangeRateData | null;
      trend: string;
      error?: string; // 환율 API 에러 상세
    };
  };
  recommendation: string;
  error?: string;
}

/**
 * 여행 점수 계산 (날씨 + 환율)
 */
export async function calculateTravelScore(input: TravelScoreInput): Promise<TravelScoreResult> {
  try {
    const checkInDate = new Date(input.checkInDate);

    // 병렬로 API 호출
    const [weatherResult, exchangeRateData] = await Promise.all([
      getWeatherForDate(input.latitude, input.longitude, checkInDate),
      getUsdToKrwRate(),
    ]);

    // 날씨 데이터 처리
    let weatherData: WeatherData | null = null;
    let weatherError: string | undefined;

    if (weatherResult && 'error' in weatherResult) {
      // 에러 객체
      weatherError = weatherResult.error;
      console.error('Weather API error:', weatherResult);
    } else {
      // 정상 데이터
      weatherData = weatherResult;
    }

    // 날씨 점수 계산
    const weatherScore = weatherData ? calculateWeatherScore(weatherData) : 0;

    // 환율 점수 계산
    const exchangeRateScore = exchangeRateData ? calculateExchangeRateScore(exchangeRateData.rate) : 0;
    const exchangeRateTrend = exchangeRateData ? getExchangeRateTrend(exchangeRateData.rate) : '정보 없음';

    // 종합 점수 (가중 평균)
    // 날씨 70%, 환율 30%
    const overallScore = Math.round(weatherScore * 0.7 + exchangeRateScore * 0.3);

    // 추천 메시지 생성
    const recommendation = generateRecommendation(overallScore, weatherData, exchangeRateTrend);

    return {
      success: true,
      overallScore,
      breakdown: {
        weather: {
          score: weatherScore,
          data: weatherData,
          error: weatherError,
        },
        exchangeRate: {
          score: exchangeRateScore,
          data: exchangeRateData,
          trend: exchangeRateTrend,
        },
      },
      recommendation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      overallScore: 0,
      breakdown: {
        weather: { score: 0, data: null, error: message },
        exchangeRate: { score: 0, data: null, trend: '정보 없음' },
      },
      recommendation: '',
      error: message,
    };
  }
}

/**
 * 점수 기반 추천 메시지 생성
 */
function generateRecommendation(score: number, weather: WeatherData | null, exchangeTrend: string): string {
  if (score >= 85) {
    return `완벽한 여행 타이밍입니다! ${weather?.condition || '날씨'} 예보이며, 환율도 ${exchangeTrend}합니다. 지금 바로 예약하세요!`;
  } else if (score >= 70) {
    return `좋은 여행 시기입니다. ${weather?.condition || '날씨'} 예보이며, 환율은 ${exchangeTrend}합니다.`;
  } else if (score >= 50) {
    return `나쁘지 않은 시기입니다. ${weather?.condition || '날씨'} 예보이며, 환율은 ${exchangeTrend}합니다. 일정 조정을 고려해보세요.`;
  } else {
    return `여행 시기를 재고려해보세요. ${weather?.condition || '날씨'} 예보이며, 환율은 ${exchangeTrend}합니다. 다른 날짜를 확인해보시기 바랍니다.`;
  }
}
