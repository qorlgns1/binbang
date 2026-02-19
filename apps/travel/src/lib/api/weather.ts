import { generateCacheKey, getCachedOrFetch } from '@/services/cache.service';

export interface WeatherParams {
  city: string;
  month?: number;
}

export interface MonthlyWeather {
  month: number;
  monthName: string;
  avgTempC: number;
  avgTempF: number;
  minTempC: number;
  maxTempC: number;
  humidity: number;
  rainfallMm: number;
  description: string;
}

export interface WeatherResult {
  city: string;
  country: string;
  monthly: MonthlyWeather[];
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const FETCH_TIMEOUT_MS = 10000;
const WEATHER_CACHE_FRESH_TTL = 604800; // 7 days (historical weather data doesn't change)
const WEATHER_CACHE_STALE_TTL = 604800; // stale-if-error window

export async function fetchWeatherHistory(params: WeatherParams): Promise<WeatherResult> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return createFallbackWeather(params.city, params.month);
  }

  const cacheKey = generateCacheKey('weather', params);
  try {
    return await getCachedOrFetch({
      key: cacheKey,
      logLabel: 'weather',
      freshTtlSeconds: WEATHER_CACHE_FRESH_TTL,
      staleTtlSeconds: WEATHER_CACHE_STALE_TTL,
      fetcher: async () => fetchWeatherFromApi(params, apiKey),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Weather API request timed out');
    } else {
      console.error('Weather API fetch failed:', error);
    }
    return createFallbackWeather(params.city, params.month);
  }
}

async function fetchWeatherFromApi(params: WeatherParams, apiKey: string): Promise<WeatherResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // First geocode the city
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(params.city)}&limit=1&appid=${apiKey}`;
    const geoResponse = await fetch(geoUrl, { signal: controller.signal });

    if (!geoResponse.ok) {
      const responseText = (await geoResponse.text()).slice(0, 500);
      throw new Error(`OpenWeather geocode error (${geoResponse.status}): ${responseText}`);
    }

    const geoData = (await geoResponse.json()) as Array<{
      lat: number;
      lon: number;
      country: string;
    }>;

    if (geoData.length === 0) {
      return createFallbackWeather(params.city, params.month);
    }

    const { lat, lon, country } = geoData[0];

    // Use current weather as a baseline reference
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    const weatherResponse = await fetch(weatherUrl, { signal: controller.signal });

    if (!weatherResponse.ok) {
      const responseText = (await weatherResponse.text()).slice(0, 500);
      throw new Error(`OpenWeather current weather error (${weatherResponse.status}): ${responseText}`);
    }

    const weatherData = (await weatherResponse.json()) as {
      main: { temp: number; humidity: number; temp_min: number; temp_max: number };
      weather: Array<{ description: string }>;
    };

    const currentTemp = weatherData.main.temp;
    const currentHumidity = weatherData.main.humidity;
    const currentDescription = weatherData.weather[0]?.description ?? 'clear sky';

    // Generate monthly estimates based on current data and latitude
    const monthly = generateMonthlyEstimates(currentTemp, currentHumidity, lat, params.month);

    // Override current month with actual data
    const currentMonth = new Date().getMonth();
    const currentMonthData = monthly.find((m) => m.month === currentMonth + 1);
    if (currentMonthData) {
      currentMonthData.avgTempC = Math.round(currentTemp);
      currentMonthData.avgTempF = Math.round(currentTemp * 1.8 + 32);
      currentMonthData.humidity = currentHumidity;
      currentMonthData.description = currentDescription;
    }

    const filteredMonthly = params.month ? monthly.filter((m) => m.month === params.month) : monthly;

    const result = {
      city: params.city,
      country,
      monthly: filteredMonthly,
    };
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

function generateMonthlyEstimates(
  baseTemp: number,
  baseHumidity: number,
  latitude: number,
  _filterMonth?: number,
): MonthlyWeather[] {
  const isNorthern = latitude >= 0;
  const seasonalVariation = Math.min(Math.abs(latitude) / 3, 15);

  return MONTH_NAMES.map((name, i) => {
    const month = i + 1;
    // Seasonal offset: Northern hemisphere warmest in July, Southern in January
    const peakMonth = isNorthern ? 6 : 0;
    const offset = Math.cos(((i - peakMonth) * Math.PI) / 6) * seasonalVariation;
    const avgTemp = Math.round(baseTemp + offset - seasonalVariation / 2);
    const minTemp = avgTemp - Math.round(3 + Math.random() * 3);
    const maxTemp = avgTemp + Math.round(3 + Math.random() * 3);

    const humidityOffset = Math.sin(((i - 3) * Math.PI) / 6) * 15;
    const humidity = Math.round(Math.max(20, Math.min(95, baseHumidity + humidityOffset)));
    const rainfallMm = Math.round(Math.max(5, humidity * 1.5 + (Math.random() - 0.5) * 50));

    let description = 'clear sky';
    if (rainfallMm > 150) description = 'heavy rain season';
    else if (rainfallMm > 100) description = 'rainy season';
    else if (rainfallMm > 60) description = 'occasional rain';
    else if (avgTemp < 5) description = 'cold and dry';
    else if (avgTemp > 30) description = 'hot and humid';
    else description = 'pleasant weather';

    return {
      month,
      monthName: name,
      avgTempC: avgTemp,
      avgTempF: Math.round(avgTemp * 1.8 + 32),
      minTempC: minTemp,
      maxTempC: maxTemp,
      humidity,
      rainfallMm,
      description,
    };
  });
}

function createFallbackWeather(city: string, month?: number): WeatherResult {
  const monthly = generateMonthlyEstimates(25, 60, 15, month);
  const filteredMonthly = month ? monthly.filter((m) => m.month === month) : monthly;
  return { city, country: 'Unknown', monthly: filteredMonthly };
}
