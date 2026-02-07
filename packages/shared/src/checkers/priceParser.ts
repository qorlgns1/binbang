const CURRENCY_MAP: Record<string, string> = {
  '₩': 'KRW',
  $: 'USD',
  '€': 'EUR',
  '£': 'GBP',
  CHF: 'CHF',
};

export interface ParsedPrice {
  amount: number; // 최소 단위 (원/센트)
  currency: string; // ISO 코드: KRW, USD, EUR, GBP, CHF
}

/**
 * 가격 문자열을 파싱하여 숫자와 통화를 분리한다.
 *
 * "₩150,000"  → { amount: 150000, currency: 'KRW' }
 * "$200.50"   → { amount: 20050,  currency: 'USD' }
 * "€50"       → { amount: 5000,   currency: 'EUR' }
 * "CHF 100"   → { amount: 10000,  currency: 'CHF' }
 * "£75.50"    → { amount: 7550,   currency: 'GBP' }
 *
 * 파싱 실패 시 null 반환 (워커 안정성 유지).
 */
export function parsePrice(raw: string | null): ParsedPrice | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  let currency: string | null = null;
  let numericPart = trimmed;

  for (const [symbol, code] of Object.entries(CURRENCY_MAP)) {
    if (trimmed.startsWith(symbol)) {
      currency = code;
      numericPart = trimmed.slice(symbol.length).trim();
      break;
    }
  }

  if (!currency) return null;

  // 쉼표 제거 후 숫자 파싱
  const cleaned = numericPart.replace(/,/g, '');
  const value = parseFloat(cleaned);
  if (isNaN(value) || value < 0) return null;

  // 최소 단위로 변환: KRW=원(소수점 없음), 나머지=센트(×100)
  const amount = currency === 'KRW' ? Math.round(value) : Math.round(value * 100);

  return { amount, currency };
}
