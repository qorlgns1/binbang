export interface PlaceEntity {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: string;
  types: string[];
  photoUrl?: string;
  placeId: string;
}

export interface WeatherData {
  city: string;
  country: string;
  monthly: MonthlyWeather[];
}

export interface MonthlyWeather {
  month: number;
  monthName: string;
  avgTempC: number;
  avgTempF: number;
  minTempC: number;
  maxTempC: number;
  humidity: number;
  rainfallMm: number;
  description: string;
}

export interface ExchangeRateData {
  baseCurrency: string;
  rates: Record<string, number>;
  lastUpdated: string;
}

export interface MapEntity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'place' | 'restaurant' | 'accommodation' | 'attraction';
  photoUrl?: string;
}

export interface AccommodationEntity {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  photoUrl?: string;
  /** Awin 추적 링크. 광고주 미등록 또는 링크 생성 실패 시 undefined */
  affiliateLink?: string;
  /** true = 광고/제휴 배지 표시 대상 */
  isAffiliate: boolean;
  /** Awin 광고주 이름 (isAffiliate=true 일 때만 존재) */
  advertiserName?: string;
}

export interface SearchAccommodationResult {
  /** 제휴 카드 1개. 검색 결과가 없으면 null */
  affiliate: AccommodationEntity | null;
  /** 비제휴 대안 (최대 2개, rating DESC 정렬) */
  alternatives: AccommodationEntity[];
  /** true = affiliateLink가 정상 생성됨 */
  ctaEnabled: boolean;
  /** "awin:{advertiserId}" | "awin_pending:accommodation" */
  provider: string;
}
