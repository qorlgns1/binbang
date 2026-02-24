const CURRENCY_CONFIG: Record<string, { locale: string; symbol: string; zeroDecimals: boolean }> = {
  KRW: { locale: 'ko-KR', symbol: '₩', zeroDecimals: true },
  USD: { locale: 'en-US', symbol: '$', zeroDecimals: false },
  EUR: { locale: 'de-DE', symbol: '€', zeroDecimals: false },
  GBP: { locale: 'en-GB', symbol: '£', zeroDecimals: false },
  CHF: { locale: 'de-CH', symbol: 'CHF', zeroDecimals: false },
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_CONFIG[currency]?.symbol ?? currency;
}

export function formatPrice(amount: number, currency: string): string {
  const config = CURRENCY_CONFIG[currency];
  if (!config) return `${currency} ${amount.toLocaleString()}`;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: config.zeroDecimals ? 0 : 2,
    maximumFractionDigits: config.zeroDecimals ? 0 : 2,
  }).format(amount);
}

export function formatPriceShort(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const config = CURRENCY_CONFIG[currency];
  const isZeroDecimals = config?.zeroDecimals ?? true;

  if (isZeroDecimals) {
    if (amount >= 100_000_000) return `${symbol}${Math.round(amount / 100_000_000)}억`;
    if (amount >= 10_000) return `${symbol}${Math.round(amount / 10_000)}만`;
    if (amount >= 1_000) return `${symbol}${Math.round(amount / 1_000)}천`;
    return `${symbol}${amount}`;
  }

  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount}`;
}
