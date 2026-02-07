export interface ParsedPrice {
    amount: number;
    currency: string;
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
export declare function parsePrice(raw: string | null): ParsedPrice | null;
//# sourceMappingURL=priceParser.d.ts.map