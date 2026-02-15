/**
 * OpenWeatherMap API 통합
 * 무료 티어: 1,000 calls/day
 * 문서: https://openweathermap.org/current
 */

export interface WeatherData {
  temperature: number; // 섭씨
  condition: string; // "맑음", "비", "눈" 등
  description: string;
  precipitationProbability: number; // 강수 확률 (0-100)
}

/**
 * 날씨 상태 코드를 한글로 변환
 */
function translateWeatherCondition(main: string): string {
  const map: Record<string, string> = {
    Clear: '맑음',
    Clouds: '흐림',
    Rain: '비',
    Drizzle: '이슬비',
    Thunderstorm: '뇌우',
    Snow: '눈',
    Mist: '안개',
    Fog: '안개',
  };
  return map[main] || main;
}

export interface WeatherError {
  error: string;
  details?: unknown;
}

/**
 * 특정 날짜의 날씨 정보 조회
 * 현재는 Current Weather API 사용 (무료)
 * TODO: 5 Day Forecast API 추가하여 미래 날짜 예보 지원
 */
export async function getWeatherForDate(
  lat: number,
  lon: number,
  _date: Date, // TODO: 예보 API 추가 시 사용
): Promise<WeatherData | null | WeatherError> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return { error: 'OPENWEATHER_API_KEY not configured' };
  }

  try {
    // Current Weather Data API 2.5 사용 (무료)
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return {
        error: `OpenWeatherMap API error (${res.status})`,
        details: errorText,
      };
    }

    const data = (await res.json()) as {
      weather?: Array<{ id: number; main: string; description: string }>;
      main?: { temp: number };
    };

    if (!data.weather || !data.main) {
      return { error: 'Invalid response from OpenWeatherMap API', details: data };
    }

    // Current Weather API는 현재 날씨만 제공 (예보 기능 없음)
    return {
      temperature: Math.round(data.main.temp),
      condition: translateWeatherCondition(data.weather[0]?.main || 'Unknown'),
      description: data.weather[0]?.description || '',
      precipitationProbability: 0, // Current API는 강수 확률 제공 안 함
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: `Failed to fetch weather data: ${message}` };
  }
}

/**
 * 날씨 점수 계산 (0-100)
 * 맑음/높은 온도/낮은 강수 확률 = 높은 점수
 */
export function calculateWeatherScore(weather: WeatherData): number {
  let score = 50; // 기본 점수

  // 날씨 상태에 따른 점수 (0-40)
  const conditionScores: Record<string, number> = {
    맑음: 40,
    흐림: 25,
    이슬비: 15,
    비: 5,
    눈: 10,
    뇌우: 0,
    안개: 20,
  };
  score += conditionScores[weather.condition] || 20;

  // 온도에 따른 점수 (0-30)
  // 18-25도가 최적
  if (weather.temperature >= 18 && weather.temperature <= 25) {
    score += 30;
  } else if (weather.temperature >= 15 && weather.temperature <= 28) {
    score += 20;
  } else if (weather.temperature >= 10 && weather.temperature <= 30) {
    score += 10;
  }

  // 강수 확률에 따른 감점 (0-30)
  score += Math.max(0, 30 - weather.precipitationProbability * 0.3);

  return Math.min(100, Math.max(0, Math.round(score)));
}
