import type { AvailabilityStatus, Platform } from './enums';

/** API/클라이언트용 숙소 타입 (JSON 직렬화로 Date → string) */
export interface Accommodation {
  id: string;
  userId: string;
  name: string;
  platform: Platform;
  url: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  isActive: boolean;
  lastCheck: string | null;
  lastStatus: AvailabilityStatus;
  lastPrice: string | null;
  createdAt: string;
  updatedAt: string;
  checkLogs?: CheckLog[];
}

export interface CheckLog {
  id: string;
  accommodationId: string;
  userId: string;
  status: AvailabilityStatus;
  price: string | null;
  errorMessage: string | null;
  notificationSent: boolean;
  createdAt: string;
}

export interface RecentLog extends CheckLog {
  accommodation: { name: string };
}

export interface CheckLogsPage {
  logs: CheckLog[];
  nextCursor: string | null;
}

export interface CreateAccommodationInput {
  name: string;
  platform: string;
  url: string;
  checkIn: string;
  checkOut: string;
  adults: number;
}

export interface UpdateAccommodationInput {
  name?: string;
  url?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  isActive?: boolean;
}

export interface PriceDataPoint {
  createdAt: string;
  priceAmount: number;
  priceCurrency: string;
  pricePerNight: number | null;
  movingAvg: number | null;
  isLegacy: boolean;
}

export interface PerNightStats {
  min: number;
  minDate: string;
  max: number;
  maxDate: string;
  avg: number;
  current: number | null;
}

export interface PriceStats {
  min: number;
  minDate: string;
  max: number;
  maxDate: string;
  avg: number;
  current: number | null;
  currentCurrency: string | null;
  count: number;
  perNight: PerNightStats | null;
}

export interface PriceHistoryResponse {
  prices: PriceDataPoint[];
  stats: PriceStats | null;
}

/** Cron processor용 - Prisma select 결과 (Date 사용) */
export interface AccommodationWithUser {
  id: string;
  name: string;
  url: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  platform: Platform;
  lastStatus: AvailabilityStatus | null;
  user: {
    id: string;
    kakaoAccessToken: string | null;
  };
}
