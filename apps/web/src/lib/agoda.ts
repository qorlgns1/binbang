export const AGODA_API_BASE = 'http://affiliateapi7643.agoda.com/affiliateservice/lt_v1';

/**
 * Authorization 헤더 값을 반환한다.
 * 형식: {siteid}:{apikey}
 */
export function getAgodaAuthHeader(): string | null {
  const siteId = process.env.AGODA_AFFILIATE_SITE_ID?.trim();
  const apiKey = process.env.AGODA_AFFILIATE_API_KEY?.trim();
  if (!siteId || !apiKey) return null;
  return `${siteId}:${apiKey}`;
}
