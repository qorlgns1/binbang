export const AGODA_API_BASE = 'http://affiliateapi7643.agoda.com/affiliateservice/lt_v1';

/**
 * Authorization 헤더 값을 반환한다.
 * AGODA_API_KEY 형식: {siteid}:{apikey}
 */
export function getAgodaAuthHeader(): string | null {
  return process.env.AGODA_API_KEY ?? null;
}
