import { AGODA_API_BASE, getAgodaAuthHeader } from '@/lib/agoda';

// ============================================================================
// Types
// ============================================================================

export interface AgodaApiResult {
  ok: boolean;
  status?: number;
  message?: string;
  error?: string;
  hint?: string;
  body?: unknown;
}

export interface AgodaOccupancy {
  numberOfAdult: number;
  numberOfChildren: number;
  childrenAges?: number[];
}

export interface AgodaCitySearchInput {
  checkInDate: string;
  checkOutDate: string;
  cityId: number;
  currency?: string;
  language?: string;
  discountOnly?: boolean;
  sortBy?: string;
  maxResult?: number;
  minimumStarRating?: number;
  minimumReviewScore?: number;
  dailyRateMin?: number;
  dailyRateMax?: number;
  occupancy?: AgodaOccupancy;
}

export interface AgodaHotelSearchInput {
  checkInDate: string;
  checkOutDate: string;
  hotelIds: number[];
  currency?: string;
  language?: string;
  occupancy?: AgodaOccupancy;
}

// ============================================================================
// Error class
// ============================================================================

export class AgodaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgodaConfigError';
  }
}

// ============================================================================
// Helpers
// ============================================================================

function requireAuthHeader(): string {
  const auth = getAgodaAuthHeader();
  if (!auth) {
    throw new AgodaConfigError('AGODA_API_KEY가 설정되지 않았습니다.');
  }
  return auth;
}

async function callAgodaApi(authHeader: string, body: unknown): Promise<AgodaApiResult> {
  const res = await fetch(AGODA_API_BASE, {
    method: 'POST',
    headers: {
      'Accept-Encoding': 'gzip,deflate',
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 500) };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, body: data };
  }

  return { ok: true, status: res.status, body: data };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function agodaCitySearch(input: AgodaCitySearchInput): Promise<AgodaApiResult> {
  const authHeader = requireAuthHeader();

  const occupancy: AgodaOccupancy = input.occupancy ?? { numberOfAdult: 2, numberOfChildren: 0 };

  const additional: Record<string, unknown> = {
    currency: input.currency ?? 'USD',
    language: input.language ?? 'ko-kr',
    occupancy,
  };

  if (input.discountOnly !== undefined) additional.discountOnly = input.discountOnly;
  if (input.sortBy) additional.sortBy = input.sortBy;
  if (input.maxResult !== undefined) additional.maxResult = input.maxResult;
  if (input.minimumStarRating !== undefined) additional.minimumStarRating = input.minimumStarRating;
  if (input.minimumReviewScore !== undefined) additional.minimumReviewScore = input.minimumReviewScore;

  if (input.dailyRateMin !== undefined || input.dailyRateMax !== undefined) {
    additional.dailyRate = {
      minimum: input.dailyRateMin ?? 1,
      maximum: input.dailyRateMax ?? 10000,
    };
  }

  const requestBody = {
    criteria: {
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      cityId: input.cityId,
      additional,
    },
  };

  const result = await callAgodaApi(authHeader, requestBody);
  if (result.ok) result.message = 'City Search 성공';
  return result;
}

export async function agodaHotelSearch(input: AgodaHotelSearchInput): Promise<AgodaApiResult> {
  const authHeader = requireAuthHeader();

  const occupancy: AgodaOccupancy = input.occupancy ?? { numberOfAdult: 2, numberOfChildren: 0 };

  const requestBody = {
    criteria: {
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      hotelId: input.hotelIds,
      additional: {
        currency: input.currency ?? 'USD',
        language: input.language ?? 'ko-kr',
        occupancy,
      },
    },
  };

  const result = await callAgodaApi(authHeader, requestBody);
  if (result.ok) result.message = 'Hotel List Search 성공';
  return result;
}
