import { fetchExchangeRate } from '@/lib/api/exchangeRate';
import { searchGooglePlaces } from '@/lib/api/places';
import { fetchWeatherHistory } from '@/lib/api/weather';
import { POPULAR_TRAVEL_DESTINATIONS } from '@/lib/cache/popularDestinations';
import { generateCacheKey, getCacheEntryState } from '@/services/cache.service';

const PLACE_TYPES = ['tourist_attraction', 'restaurant', 'hotel'] as const;
const POPULAR_CURRENCY_PAIRS = [{ base: 'USD', targets: ['KRW', 'JPY', 'EUR'] }] as const;
const PREWARM_CONCURRENCY = Math.max(1, Number.parseInt(process.env.CACHE_PREWARM_CONCURRENCY ?? '5', 10));

interface PlacePrewarmTarget {
  destination: string;
  placeType: (typeof PLACE_TYPES)[number];
}

interface ExchangeRatePrewarmTarget {
  base: string;
  targets: readonly string[];
}

const PLACE_PREWARM_TARGETS: PlacePrewarmTarget[] = POPULAR_TRAVEL_DESTINATIONS.flatMap((destination) =>
  PLACE_TYPES.map((placeType) => ({ destination, placeType })),
);
const WEATHER_PREWARM_TARGETS = [...POPULAR_TRAVEL_DESTINATIONS];
const EXCHANGE_RATE_PREWARM_TARGETS: ExchangeRatePrewarmTarget[] = POPULAR_CURRENCY_PAIRS.map((pair) => ({
  base: pair.base,
  targets: [...pair.targets],
}));

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

interface RunPrewarmTargetsOptions<T> {
  items: readonly T[];
  metrics: CachePrewarmMetrics;
  logLabel: string;
  keyOf: (item: T) => string;
  fetch: (item: T) => Promise<unknown>;
  failMessage: (item: T) => string;
  concurrency?: number;
}

async function runPrewarmTargets<T>({
  items,
  metrics,
  logLabel,
  keyOf,
  fetch,
  failMessage,
  concurrency = PREWARM_CONCURRENCY,
}: RunPrewarmTargetsOptions<T>): Promise<void> {
  const runOne = async (item: T): Promise<void> => {
    const cacheKey = keyOf(item);
    const state = await getCacheEntryState(cacheKey, logLabel);
    if (state !== 'miss') {
      metrics.skipped += 1;
      return;
    }
    try {
      await fetch(item);
      metrics.warmed += 1;
    } catch (error) {
      metrics.failed += 1;
      console.error(failMessage(item), error);
    }
  };

  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.allSettled(items.slice(i, i + concurrency).map(runOne));
  }
}

async function runPlacesPrewarm(metrics: CachePrewarmMetrics): Promise<void> {
  await runPrewarmTargets({
    items: PLACE_PREWARM_TARGETS,
    metrics,
    logLabel: 'places-prewarm',
    keyOf: (target) => placesCacheKey(target.destination, target.placeType),
    fetch: async (target) =>
      searchGooglePlaces({
        query: target.placeType.replace('_', ' '),
        location: target.destination,
        type: target.placeType,
      }),
    failMessage: (target) => `[cache-prewarm] places failed destination=${target.destination} type=${target.placeType}`,
  });
}

async function runWeatherPrewarm(metrics: CachePrewarmMetrics): Promise<void> {
  await runPrewarmTargets({
    items: WEATHER_PREWARM_TARGETS,
    metrics,
    logLabel: 'weather-prewarm',
    keyOf: weatherCacheKey,
    fetch: async (city) => fetchWeatherHistory({ city }),
    failMessage: (city) => `[cache-prewarm] weather failed city=${city}`,
  });
}

async function runExchangeRatePrewarm(metrics: CachePrewarmMetrics): Promise<void> {
  await runPrewarmTargets({
    items: EXCHANGE_RATE_PREWARM_TARGETS,
    metrics,
    logLabel: 'exchange-rate-prewarm',
    keyOf: (target) => exchangeRateCacheKey(target.base, target.targets),
    fetch: async (target) =>
      fetchExchangeRate({
        baseCurrency: target.base,
        targetCurrencies: [...target.targets],
      }),
    failMessage: (target) => `[cache-prewarm] exchange-rate failed base=${target.base}`,
  });
}

export async function runTravelCachePrewarm(): Promise<TravelCachePrewarmResult> {
  const startedAt = new Date();
  const places = createMetrics(PLACE_PREWARM_TARGETS.length);
  const weather = createMetrics(WEATHER_PREWARM_TARGETS.length);
  const exchangeRate = createMetrics(EXCHANGE_RATE_PREWARM_TARGETS.length);

  await Promise.all([runPlacesPrewarm(places), runWeatherPrewarm(weather), runExchangeRatePrewarm(exchangeRate)]);

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
