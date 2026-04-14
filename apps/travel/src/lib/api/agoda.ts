import { prisma } from '@workspace/db';

import { withAbortTimeout } from '@/lib/withTimeout';

interface RecordValue {
  [key: string]: unknown;
}

export interface SearchAgodaAccommodationParams {
  query: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
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

const DEFAULT_AGODA_API_URL = 'http://affiliateapi7643.agoda.com/affiliateservice/lt_v1';
const AGODA_TIMEOUT_MS = 30000;
const DEFAULT_LIMIT = 5;
const DEFAULT_STAY_NIGHTS = 2;
const DEFAULT_ROOMS = 1;
const DEFAULT_ADULTS = 2;
const MAX_CANDIDATE_HOTELS = 12;
const MAX_HOTEL_IDS_PER_REQUEST = 20;
const GENERIC_QUERY_TERMS = new Set([
  'hotel',
  'hotels',
  'accommodation',
  'accommodations',
  'stay',
  'stays',
  'lodging',
  'bookable',
  'booking',
  'best',
  'top',
  'show',
  'searchaccommodation',
  '예약',
  '가능한',
  '숙소',
  '호텔',
  '추천',
  '여행',
  '필요해',
  '우선',
  '보여줘',
  '포함해줘',
  '정보',
  '상관없음',
  'in',
  'for',
  'near',
  'the',
  'of',
  'at',
  'with',
  'from',
  'to',
]);

interface AgodaHotelCandidate {
  hotelId: number;
  hotelNameKo: string | null;
  hotelNameEn: string | null;
  cityNameKo: string | null;
  cityNameEn: string | null;
  countryNameKo: string | null;
  countryNameEn: string | null;
  starRating: number | null;
  ratingAverage: number | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  url: string | null;
}

interface AgodaStayCriteria {
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  rooms: number;
  children: number;
  currency: string;
  language: string;
  userCountry: string;
}

interface AgodaOfferSummary {
  hotelId: string;
  landingUrl?: string;
  priceAmount?: number;
  priceCurrency?: string;
  available: boolean;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
}

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

function buildAgodaAffiliateLink(siteId: string, hotelId: string, stayCriteria?: AgodaStayCriteria): string {
  const url = new URL('https://www.agoda.com/partners/partnersearch.aspx');
  url.searchParams.set('pcs', '1');
  url.searchParams.set('cid', siteId);
  url.searchParams.set('hid', hotelId);

  if (stayCriteria) {
    url.searchParams.set('checkin', stayCriteria.checkInDate);
    url.searchParams.set('checkout', stayCriteria.checkOutDate);
    url.searchParams.set('NumberofAdults', String(stayCriteria.adults));
    url.searchParams.set('NumberofChildren', String(stayCriteria.children));
    url.searchParams.set('Rooms', String(stayCriteria.rooms));
    url.searchParams.set('currency', stayCriteria.currency);
  }

  return url.toString();
}

function dateOnlyFromNow(offsetDays: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function sanitizeSearchText(value: string): string {
  return value
    .replace(/\b20\d{2}-\d{2}-\d{2}\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s,-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSearchText(value: string): string[] {
  return sanitizeSearchText(value)
    .split(/[\s,]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !GENERIC_QUERY_TERMS.has(token.toLowerCase()));
}

function containsHangul(value: string): boolean {
  return /[\u3131-\u318e\uac00-\ud7a3]/.test(value);
}

function normalizeAdults(adults: number | undefined): number {
  if (!adults || !Number.isFinite(adults)) return DEFAULT_ADULTS;
  return Math.max(1, Math.min(8, Math.floor(adults)));
}

function isValidDateOnly(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function parseStayCriteria(params: SearchAgodaAccommodationParams): AgodaStayCriteria {
  const dateMatches = params.query.match(/\b20\d{2}-\d{2}-\d{2}\b/g) ?? [];
  const explicitCheckInDate = isValidDateOnly(params.checkIn) ? params.checkIn : undefined;
  const explicitCheckOutDate = isValidDateOnly(params.checkOut) ? params.checkOut : undefined;
  const hasExplicitDateRange =
    explicitCheckInDate != null && explicitCheckOutDate != null && explicitCheckOutDate > explicitCheckInDate;

  const checkInDate = hasExplicitDateRange ? explicitCheckInDate : (dateMatches[0] ?? dateOnlyFromNow(1));
  const rawCheckOutDate = hasExplicitDateRange
    ? explicitCheckOutDate
    : (dateMatches[1] ?? dateOnlyFromNow(1 + DEFAULT_STAY_NIGHTS));
  const checkOutDate = rawCheckOutDate > checkInDate ? rawCheckOutDate : dateOnlyFromNow(1 + DEFAULT_STAY_NIGHTS);

  const koreanAdults = params.query.match(/성인은?\s*(\d+)\s*명/);
  const englishAdults =
    params.query.match(/\b(\d+)\s*adult(?:\(s\))?\b/i) ?? params.query.match(/\badults?\s*[:=]?\s*(\d+)\b/i);
  const adults = normalizeAdults(
    params.adults ?? Number.parseInt(koreanAdults?.[1] ?? englishAdults?.[1] ?? String(DEFAULT_ADULTS), 10),
  );
  const language = containsHangul(params.query) ? 'ko-kr' : 'en-us';
  const currency = language === 'ko-kr' ? 'KRW' : 'USD';
  const userCountry = language === 'ko-kr' ? 'KR' : 'US';

  return {
    checkInDate,
    checkOutDate,
    adults,
    rooms: DEFAULT_ROOMS,
    children: 0,
    currency,
    language,
    userCountry,
  };
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function bestTerm(values: Array<string | null | undefined>): string | null {
  return (
    values.find((value): value is string => {
      const normalized = value?.trim();
      return Boolean(normalized && normalized.length >= 2);
    }) ?? null
  );
}

async function findCandidateHotels(params: SearchAgodaAccommodationParams): Promise<AgodaHotelCandidate[]> {
  const [cityTermRaw, countryTermRaw] = (params.location ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const queryTokens = [...new Set([...tokenizeSearchText(params.query), ...tokenizeSearchText(params.location ?? '')])];
  const cityTerm = bestTerm([cityTermRaw, ...queryTokens]);
  const countryTerm = bestTerm([countryTermRaw]);
  const queryTerm = bestTerm([sanitizeSearchText(params.query), sanitizeSearchText(params.location ?? '')]);

  const rowsByHotelId = new Map<number, AgodaHotelCandidate>();

  async function collectCandidates(where: object): Promise<void> {
    if (rowsByHotelId.size >= MAX_CANDIDATE_HOTELS) return;

    const rows = await prisma.agodaHotelSearch.findMany({
      where,
      select: {
        hotelId: true,
        hotelNameKo: true,
        hotelNameEn: true,
        cityNameKo: true,
        cityNameEn: true,
        countryNameKo: true,
        countryNameEn: true,
        starRating: true,
        ratingAverage: true,
        reviewCount: true,
        latitude: true,
        longitude: true,
        photoUrl: true,
        url: true,
      },
      orderBy: [{ reviewCount: 'desc' }, { ratingAverage: 'desc' }],
      take: MAX_CANDIDATE_HOTELS,
    });

    for (const row of rows) {
      if (rowsByHotelId.has(row.hotelId)) continue;
      rowsByHotelId.set(row.hotelId, row);
      if (rowsByHotelId.size >= MAX_CANDIDATE_HOTELS) break;
    }
  }

  if (cityTerm) {
    await collectCandidates({
      OR: [
        {
          AND: [
            {
              OR: [
                { cityNameKo: { contains: cityTerm, mode: 'insensitive' } },
                { cityNameEn: { contains: cityTerm, mode: 'insensitive' } },
              ],
            },
            ...(countryTerm
              ? [
                  {
                    OR: [
                      { countryNameKo: { contains: countryTerm, mode: 'insensitive' } },
                      { countryNameEn: { contains: countryTerm, mode: 'insensitive' } },
                    ],
                  },
                ]
              : []),
          ],
        },
        {
          OR: [
            { cityNameKo: { contains: cityTerm, mode: 'insensitive' } },
            { cityNameEn: { contains: cityTerm, mode: 'insensitive' } },
          ],
        },
      ],
    });
  }

  if (rowsByHotelId.size < MAX_CANDIDATE_HOTELS && queryTerm) {
    await collectCandidates({
      OR: [
        { hotelNameKo: { contains: queryTerm, mode: 'insensitive' } },
        { hotelNameEn: { contains: queryTerm, mode: 'insensitive' } },
        { searchTextKo: { contains: queryTerm, mode: 'insensitive' } },
        { searchTextEn: { contains: queryTerm, mode: 'insensitive' } },
      ],
    });
  }

  if (rowsByHotelId.size < MAX_CANDIDATE_HOTELS) {
    for (const token of queryTokens.slice(0, 6)) {
      await collectCandidates({
        OR: [
          { hotelNameKo: { contains: token, mode: 'insensitive' } },
          { hotelNameEn: { contains: token, mode: 'insensitive' } },
          { cityNameKo: { contains: token, mode: 'insensitive' } },
          { cityNameEn: { contains: token, mode: 'insensitive' } },
          { countryNameKo: { contains: token, mode: 'insensitive' } },
          { countryNameEn: { contains: token, mode: 'insensitive' } },
          { searchTextKo: { contains: token, mode: 'insensitive' } },
          { searchTextEn: { contains: token, mode: 'insensitive' } },
        ],
      });
      if (rowsByHotelId.size >= MAX_CANDIDATE_HOTELS) break;
    }
  }

  return [...rowsByHotelId.values()].slice(0, MAX_CANDIDATE_HOTELS);
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

function extractOfferSummaries(payload: unknown): AgodaOfferSummary[] {
  const offersByHotelId = new Map<string, AgodaOfferSummary>();

  for (const item of extractCandidates(payload)) {
    if (!isRecord(item)) continue;

    const hotelId = firstString(item, ['hotelId', 'hotel_id', 'propertyId', 'property_id', 'id', 'hid']);
    if (!hotelId) continue;

    const nextOffer: AgodaOfferSummary = {
      hotelId,
      landingUrl:
        firstString(item, ['landingURL', 'landingUrl', 'metaSearch.landingURL', 'metaSearch.landingUrl']) ?? undefined,
      priceAmount: firstNumber(item, ['dailyRate', 'price', 'totalInclusive', 'totalPayment.inclusive']),
      priceCurrency: firstString(item, ['currency', 'currencyCode', 'totalPayment.currency']) ?? undefined,
      available:
        firstBoolean(item, ['isAvailable', 'available', 'status']) ??
        Boolean(
          firstString(item, ['landingURL', 'landingUrl', 'metaSearch.landingURL', 'metaSearch.landingUrl']) ??
            firstNumber(item, ['dailyRate', 'price', 'totalInclusive', 'totalPayment.inclusive']),
        ),
      rating: firstNumber(item, ['reviewScore', 'rating', 'starRating']),
      reviewCount: firstNumber(item, ['reviewCount', 'ratingCount']),
      photoUrl: firstString(item, ['imageURL', 'imageUrl', 'photoUrl', 'thumbnail']) ?? undefined,
    };

    const currentOffer = offersByHotelId.get(hotelId);
    if (!currentOffer) {
      offersByHotelId.set(hotelId, nextOffer);
      continue;
    }

    const currentPrice = currentOffer.priceAmount ?? Number.POSITIVE_INFINITY;
    const nextPrice = nextOffer.priceAmount ?? Number.POSITIVE_INFINITY;
    if (nextOffer.available && !currentOffer.available) {
      offersByHotelId.set(hotelId, nextOffer);
    } else if (nextOffer.available === currentOffer.available && nextPrice < currentPrice) {
      offersByHotelId.set(hotelId, nextOffer);
    }
  }

  return [...offersByHotelId.values()];
}

function normalizeLimit(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.floor(limit)), 20);
}

function buildRequestBody(hotelIds: number[], stayCriteria: AgodaStayCriteria): Record<string, unknown> {
  return {
    waitTime: 8,
    criteria: {
      hotelId: hotelIds,
      checkInDate: stayCriteria.checkInDate,
      checkOutDate: stayCriteria.checkOutDate,
      rooms: stayCriteria.rooms,
      adults: stayCriteria.adults,
      children: stayCriteria.children,
      currency: stayCriteria.currency,
      language: stayCriteria.language,
      userCountry: stayCriteria.userCountry,
    },
    features: {
      ratesPerProperty: 25,
      extra: ['rateDetail', 'metaSearch'],
    },
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
    const stayCriteria = parseStayCriteria(params);
    const candidateHotels = await findCandidateHotels(params);
    if (candidateHotels.length === 0) {
      return {
        accommodations: [],
        source: 'api',
      };
    }

    const hotelIds = candidateHotels.slice(0, MAX_HOTEL_IDS_PER_REQUEST).map((hotel) => hotel.hotelId);
    const response = await withAbortTimeout(AGODA_TIMEOUT_MS, (signal) =>
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${siteId}:${apiKey}`,
          'Accept-Encoding': 'gzip,deflate',
        },
        body: JSON.stringify(buildRequestBody(hotelIds, stayCriteria)),
        signal,
      }),
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Agoda API error (${response.status}): ${body.slice(0, 300)}`);
    }

    const payload = (await response.json()) as unknown;
    const offersByHotelId = new Map(extractOfferSummaries(payload).map((offer) => [offer.hotelId, offer]));
    const accommodations = candidateHotels
      .map((hotel) => {
        if (hotel.latitude == null || hotel.longitude == null) return null;

        const offer = offersByHotelId.get(String(hotel.hotelId));
        if (!offer) return null;

        const address = uniqueStrings([
          hotel.cityNameKo ?? hotel.cityNameEn,
          hotel.countryNameKo ?? hotel.countryNameEn,
        ]).join(', ');

        return {
          hotelId: String(hotel.hotelId),
          name: hotel.hotelNameKo || hotel.hotelNameEn || '',
          address,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          rating: hotel.ratingAverage ?? hotel.starRating ?? offer.rating,
          reviewCount: hotel.reviewCount ?? offer.reviewCount,
          photoUrl: hotel.photoUrl ?? offer.photoUrl,
          priceAmount: offer.priceAmount,
          priceCurrency: offer.priceCurrency,
          available: offer.available,
          affiliateLink: offer.landingUrl ?? buildAgodaAffiliateLink(siteId, String(hotel.hotelId), stayCriteria),
        } satisfies AgodaAccommodation;
      })
      .filter((item) => item !== null)
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
