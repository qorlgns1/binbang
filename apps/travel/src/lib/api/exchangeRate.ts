import { generateCacheKey, getCachedOrFetch } from '@/services/cache.service';

export interface ExchangeRateParams {
  baseCurrency: string;
  targetCurrencies: string[];
}

export interface ExchangeRateResult {
  baseCurrency: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

const FETCH_TIMEOUT_MS = 10000;
const EXCHANGE_RATE_CACHE_FRESH_TTL = 3600; // 1 hour (exchange rates change frequently)
const EXCHANGE_RATE_CACHE_STALE_TTL = 3600; // stale-if-error window

export async function fetchExchangeRate(params: ExchangeRateParams): Promise<ExchangeRateResult> {
  const base = params.baseCurrency.toUpperCase();
  const cacheKey = generateCacheKey('exchange_rate', {
    baseCurrency: base,
    targetCurrencies: params.targetCurrencies.map((c) => c.toUpperCase()),
  });

  try {
    return await getCachedOrFetch({
      key: cacheKey,
      logLabel: 'exchange_rate',
      freshTtlSeconds: EXCHANGE_RATE_CACHE_FRESH_TTL,
      staleTtlSeconds: EXCHANGE_RATE_CACHE_STALE_TTL,
      fetcher: async () => fetchExchangeRateFromApi(base, params.targetCurrencies),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Exchange rate API request timed out');
    } else {
      console.error('Exchange rate API fetch failed:', error);
    }
    return createFallbackRates(base, params.targetCurrencies);
  }
}

async function fetchExchangeRateFromApi(base: string, targetCurrencies: string[]): Promise<ExchangeRateResult> {
  const apiKey = process.env.EXCHANGERATE_API_KEY;

  // Use the free ExchangeRate-API (with or without key)
  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
    : `https://open.er-api.com/v6/latest/${base}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`ExchangeRate API error (${response.status}): ${responseText}`);
    }

    const data = (await response.json()) as {
      result: string;
      conversion_rates?: Record<string, number>;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };

    if (data.result !== 'success') {
      throw new Error(`ExchangeRate API response not successful: ${data.result ?? 'unknown'}`);
    }

    const allRates = data.conversion_rates ?? data.rates ?? {};

    const rates: Record<string, number> = {};
    for (const currency of targetCurrencies) {
      const code = currency.toUpperCase();
      if (allRates[code] !== undefined) {
        rates[code] = allRates[code];
      }
    }

    const result = {
      baseCurrency: base,
      rates,
      lastUpdated: data.time_last_update_utc ?? new Date().toISOString(),
    };
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

function createFallbackRates(base: string, targets: string[]): ExchangeRateResult {
  const rates: Record<string, number> = {};
  for (const t of targets) {
    rates[t.toUpperCase()] = 0;
  }
  return {
    baseCurrency: base,
    rates,
    lastUpdated: new Date().toISOString(),
  };
}
