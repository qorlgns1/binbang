import { fetchExchangeRate } from '@/lib/api/exchangeRate';
import { searchGooglePlaces } from '@/lib/api/places';
import { fetchWeatherHistory } from '@/lib/api/weather';
import { POPULAR_TRAVEL_DESTINATIONS } from '@/lib/cache/popularDestinations';
import { generateCacheKey, getCacheEntryState } from '@/services/cache.service';

const PLACE_TYPES = ['tourist_attraction', 'restaurant', 'hotel'] as const;
const POPULAR_CURRENCY_PAIRS = [{ base: 'USD', targets: ['KRW', 'JPY', 'EUR'] }] as const;

interface CachePrewarmMetrics {
  targets: number;
  warmed: number;
  skipped: number;
  failed: number;
}

export interface TravelCachePrewarmResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  places: CachePrewarmMetrics;
  weather: CachePrewarmMetrics;
  exchangeRate: CachePrewarmMetrics;
}

function createMetrics(targets: number): CachePrewarmMetrics {
  return {
    targets,
    warmed: 0,
    skipped: 0,
    failed: 0,
  };
}

function placesCacheKey(destination: string, placeType: string): string {
  return generateCacheKey('places', {
    query: placeType.replace('_', ' '),
    location: destination,
    type: placeType,
  });
}

function weatherCacheKey(city: string): string {
  return generateCacheKey('weather', { city });
}

function exchangeRateCacheKey(baseCurrency: string, targetCurrencies: readonly string[]): string {
  return generateCacheKey('exchange_rate', {
    baseCurrency: baseCurrency.toUpperCase(),
    targetCurrencies: targetCurrencies.map((currency) => currency.toUpperCase()),
  });
}

async function runPlacesPrewarm(metrics: CachePrewarmMetrics): Promise<void> {
  for (const destination of POPULAR_TRAVEL_DESTINATIONS) {
    for (const placeType of PLACE_TYPES) {
      const cacheKey = placesCacheKey(destination, placeType);
      const state = await getCacheEntryState(cacheKey, 'places-prewarm');
      if (state !== 'miss') {
        metrics.skipped += 1;
        continue;
      }

      try {
        await searchGooglePlaces({
          query: placeType.replace('_', ' '),
          location: destination,
          type: placeType,
        });
        metrics.warmed += 1;
      } catch (error) {
        metrics.failed += 1;
        console.error(`[cache-prewarm] places failed destination=${destination} type=${placeType}`, error);
      }
    }
  }
}

async function runWeatherPrewarm(metrics: CachePrewarmMetrics): Promise<void> {
  for (const city of POPULAR_TRAVEL_DESTINATIONS) {
    const cacheKey = weatherCacheKey(city);
    const state = await getCacheEntryState(cacheKey, 'weather-prewarm');
    if (state !== 'miss') {
      metrics.skipped += 1;
      continue;
    }

    try {
      await fetchWeatherHistory({ city });
      metrics.warmed += 1;
    } catch (error) {
      metrics.failed += 1;
      console.error(`[cache-prewarm] weather failed city=${city}`, error);
    }
  }
}

async function runExchangeRatePrewarm(metrics: CachePrewarmMetrics): Promise<void> {
  for (const pair of POPULAR_CURRENCY_PAIRS) {
    const cacheKey = exchangeRateCacheKey(pair.base, pair.targets);
    const state = await getCacheEntryState(cacheKey, 'exchange-rate-prewarm');
    if (state !== 'miss') {
      metrics.skipped += 1;
      continue;
    }

    try {
      await fetchExchangeRate({
        baseCurrency: pair.base,
        targetCurrencies: [...pair.targets],
      });
      metrics.warmed += 1;
    } catch (error) {
      metrics.failed += 1;
      console.error(`[cache-prewarm] exchange-rate failed base=${pair.base}`, error);
    }
  }
}

export async function runTravelCachePrewarm(): Promise<TravelCachePrewarmResult> {
  const startedAt = new Date();
  const places = createMetrics(POPULAR_TRAVEL_DESTINATIONS.length * PLACE_TYPES.length);
  const weather = createMetrics(POPULAR_TRAVEL_DESTINATIONS.length);
  const exchangeRate = createMetrics(POPULAR_CURRENCY_PAIRS.length);

  await runPlacesPrewarm(places);
  await runWeatherPrewarm(weather);
  await runExchangeRatePrewarm(exchangeRate);

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    places,
    weather,
    exchangeRate,
  };
}
