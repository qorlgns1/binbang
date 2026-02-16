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

export async function fetchExchangeRate(params: ExchangeRateParams): Promise<ExchangeRateResult> {
  const apiKey = process.env.EXCHANGERATE_API_KEY;
  const base = params.baseCurrency.toUpperCase();

  // Use the free ExchangeRate-API (with or without key)
  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`
    : `https://open.er-api.com/v6/latest/${base}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      return createFallbackRates(base, params.targetCurrencies);
    }

    const data = (await response.json()) as {
      result: string;
      conversion_rates?: Record<string, number>;
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };

    if (data.result !== 'success') {
      return createFallbackRates(base, params.targetCurrencies);
    }

    const allRates = data.conversion_rates ?? data.rates ?? {};

    const rates: Record<string, number> = {};
    for (const currency of params.targetCurrencies) {
      const code = currency.toUpperCase();
      if (allRates[code] !== undefined) {
        rates[code] = allRates[code];
      }
    }

    return {
      baseCurrency: base,
      rates,
      lastUpdated: data.time_last_update_utc ?? new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Exchange rate API request timed out');
    }
    return createFallbackRates(base, params.targetCurrencies);
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
