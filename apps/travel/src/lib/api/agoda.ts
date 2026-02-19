import { withAbortTimeout } from '@/lib/withTimeout';

interface RecordValue {
  [key: string]: unknown;
}

export interface SearchAgodaAccommodationParams {
  query: string;
  location?: string;
  limit?: number;
}

export interface AgodaAccommodation {
  hotelId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  priceAmount?: number;
  priceCurrency?: string;
  available: boolean;
  affiliateLink: string;
}

export interface SearchAgodaAccommodationResult {
  accommodations: AgodaAccommodation[];
  source: 'api' | 'disabled' | 'error';
  message?: string;
}

const DEFAULT_AGODA_API_URL = 'https://affiliateapi7643.agoda.com/affiliateservice/lt_v1';
const AGODA_TIMEOUT_MS = 10000;
const DEFAULT_LIMIT = 5;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null;
}

function valueAtPath(value: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = value;
  for (const key of keys) {
    if (!isRecord(current)) return undefined;
    current = current[key];
  }
  return current;
}

function firstString(value: unknown, paths: string[]): string | null {
  for (const path of paths) {
    const candidate = valueAtPath(value, path);
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
  }
  return null;
}

function firstNumber(value: unknown, paths: string[]): number | undefined {
  for (const path of paths) {
    const candidate = valueAtPath(value, path);
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string') {
      const parsed = Number.parseFloat(candidate.replace(/[^\d.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function firstBoolean(value: unknown, paths: string[]): boolean | undefined {
  for (const path of paths) {
    const candidate = valueAtPath(value, path);
    if (typeof candidate === 'boolean') return candidate;
    if (typeof candidate === 'number') return candidate !== 0;
    if (typeof candidate === 'string') {
      const normalized = candidate.trim().toLowerCase();
      if (normalized === 'true' || normalized === 'available' || normalized === 'in_stock') return true;
      if (normalized === 'false' || normalized === 'unavailable' || normalized === 'sold_out') return false;
    }
  }
  return undefined;
}

function buildAgodaAffiliateLink(siteId: string, hotelId: string): string {
  return `https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=${encodeURIComponent(siteId)}&hid=${encodeURIComponent(hotelId)}`;
}

function extractCandidates(payload: unknown): unknown[] {
  const candidates = [
    payload,
    valueAtPath(payload, 'results'),
    valueAtPath(payload, 'data'),
    valueAtPath(payload, 'data.results'),
    valueAtPath(payload, 'hotels'),
    valueAtPath(payload, 'data.hotels'),
    valueAtPath(payload, 'items'),
    valueAtPath(payload, 'data.items'),
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function mapCandidateToAccommodation(item: unknown, siteId: string): AgodaAccommodation | null {
  if (!isRecord(item)) return null;

  const hotelId = firstString(item, ['hotelId', 'hotel_id', 'id', 'hid', 'propertyId', 'property_id']);
  const name = firstString(item, ['name', 'hotelName', 'hotel_name', 'propertyName', 'title']);
  const latitude = firstNumber(item, ['latitude', 'lat', 'geo.latitude', 'location.latitude']);
  const longitude = firstNumber(item, ['longitude', 'lng', 'lon', 'geo.longitude', 'location.longitude']);

  if (!hotelId || !name || latitude == null || longitude == null) {
    return null;
  }

  const address =
    firstString(item, ['address', 'fullAddress', 'location.address', 'city']) ?? firstString(item, ['country']) ?? '';
  const rating = firstNumber(item, ['rating', 'reviewScore', 'review.rating', 'aggregateRating']);
  const reviewCount = firstNumber(item, ['reviewCount', 'reviews', 'review.count', 'ratingCount']);
  const photoUrl = firstString(item, ['image', 'imageUrl', 'thumbnail', 'photoUrl', 'photos.0']);
  const priceAmount = firstNumber(item, [
    'price',
    'priceAmount',
    'price.amount',
    'displayPrice',
    'pricing.amount',
    'lowestPrice',
  ]);
  const priceCurrency = firstString(item, ['currency', 'currencyCode', 'price.currency', 'pricing.currency']);
  const availability =
    firstBoolean(item, ['isAvailable', 'available', 'status', 'availability.status']) ??
    !String(firstString(item, ['status']) ?? '')
      .toLowerCase()
      .includes('sold');

  return {
    hotelId,
    name,
    address,
    latitude,
    longitude,
    rating,
    reviewCount,
    photoUrl: photoUrl ?? undefined,
    priceAmount,
    priceCurrency: priceCurrency ?? undefined,
    available: availability,
    affiliateLink: buildAgodaAffiliateLink(siteId, hotelId),
  };
}

function normalizeLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.floor(limit)), 20);
}

function buildRequestBody(params: SearchAgodaAccommodationParams, siteId: string): Record<string, unknown> {
  return {
    siteId,
    limit: normalizeLimit(params.limit),
    query: params.query,
    location: params.location ?? null,
  };
}

export async function searchAgodaAccommodations(
  params: SearchAgodaAccommodationParams,
): Promise<SearchAgodaAccommodationResult> {
  const apiKey = process.env.AGODA_AFFILIATE_API_KEY?.trim();
  const siteId = process.env.AGODA_AFFILIATE_SITE_ID?.trim();
  const apiUrl = process.env.AGODA_AFFILIATE_API_URL?.trim() || DEFAULT_AGODA_API_URL;

  if (!apiKey || !siteId) {
    return {
      accommodations: [],
      source: 'disabled',
      message: 'AGODA_AFFILIATE_API_KEY or AGODA_AFFILIATE_SITE_ID is not configured',
    };
  }

  try {
    const response = await withAbortTimeout(AGODA_TIMEOUT_MS, (signal) =>
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(buildRequestBody(params, siteId)),
        signal,
      }),
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Agoda API error (${response.status}): ${body.slice(0, 300)}`);
    }

    const payload = (await response.json()) as unknown;
    const accommodations = extractCandidates(payload)
      .map((item) => mapCandidateToAccommodation(item, siteId))
      .filter((item): item is AgodaAccommodation => item !== null)
      .sort((a, b) => {
        if (a.available !== b.available) return a.available ? -1 : 1;
        if (a.priceAmount != null && b.priceAmount != null) return a.priceAmount - b.priceAmount;
        return a.name.localeCompare(b.name);
      })
      .slice(0, normalizeLimit(params.limit));

    return {
      accommodations,
      source: 'api',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[agoda] search failed:', message);
    return {
      accommodations: [],
      source: 'error',
      message,
    };
  }
}
