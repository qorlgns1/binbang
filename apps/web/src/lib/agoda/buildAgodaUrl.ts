const AGODA_BASE = 'https://www.agoda.com';

export interface AgodaLandingUrlParams {
  platformId: string;
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
  adults?: number;
  rooms?: number;
  children?: number;
}

/**
 * platformId(hotelId) 기반 Agoda 호텔 예약 페이지 URL 생성 (fallback 규칙)
 * metaSearch extra에서 landingUrl을 못 받았을 때 사용
 */
export function buildAgodaLandingUrl(params: AgodaLandingUrlParams): string {
  const url = new URL(`${AGODA_BASE}/hotel-detail/${params.platformId}`);

  if (params.checkIn) url.searchParams.set('checkIn', params.checkIn);
  if (params.checkOut) url.searchParams.set('checkOut', params.checkOut);
  if (params.adults != null) url.searchParams.set('adults', String(params.adults));
  if (params.rooms != null) url.searchParams.set('rooms', String(params.rooms));
  if (params.children != null && params.children > 0) {
    url.searchParams.set('children', String(params.children));
  }

  return url.toString();
}

/**
 * /api/go 클릭아웃 URL 생성
 * 이메일 CTA에서 클릭 시 추적 후 Agoda로 이동
 */
export function buildClickoutUrl(params: { baseUrl: string; accommodationId: string; landingUrl: string }): string {
  const url = new URL(`${params.baseUrl.replace(/\/$/, '')}/api/go`);
  url.searchParams.set('accommodationId', params.accommodationId);
  url.searchParams.set('url', params.landingUrl);
  return url.toString();
}
