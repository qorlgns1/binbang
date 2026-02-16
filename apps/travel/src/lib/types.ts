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
