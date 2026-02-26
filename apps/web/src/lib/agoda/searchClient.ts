const DEFAULT_AGODA_SEARCH_API_URL = 'https://affiliateapi7643.agoda.com/affiliateservice/lt_v1';
const SEARCH_TIMEOUT_MS = 30_000;
const MAX_PROPERTY_IDS = 100;

type AgodaExtraField = 'rateDetail' | 'dailyRate' | 'cancellationDetail' | 'metaSearch';

export interface AgodaSearchCriteria {
  propertyIds: bigint[];
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children?: number;
  currency?: string;
  language?: string;
  userCountry?: string;
}

export interface AgodaSearchFeatures {
  ratesPerProperty?: number;
  extra?: AgodaExtraField[];
}

export interface AgodaSearchRequest {
  waitTime?: number;
  criteria: AgodaSearchCriteria;
  features?: AgodaSearchFeatures;
}

type AgodaSearchResponse = Record<string, unknown>;

interface AgodaSearchApiPayload {
  waitTime: number;
  criteria: {
    hotelId: number[];
    checkInDate: string;
    checkOutDate: string;
    rooms: number;
    adults: number;
    children: number;
    currency: string;
    language: string;
    userCountry: string;
    propertyIds?: string[];
  };
  features: {
    ratesPerProperty: number;
    extra: AgodaExtraField[];
  };
}

export interface AgodaSearchApiResult {
  payload: AgodaSearchResponse;
  httpStatus: number;
  latencyMs: number;
}

export class AgodaSearchClientConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgodaSearchClientConfigError';
  }
}

export class AgodaSearchRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgodaSearchRequestError';
  }
}

interface CredentialCandidates {
  siteId?: string;
  apiKey?: string;
}

function parseCombinedCredential(raw: string | undefined): CredentialCandidates {
  if (!raw) return {};
  const normalized = raw.trim();
  if (!normalized) return {};

  const index = normalized.indexOf(':');
  if (index <= 0 || index >= normalized.length - 1) {
    return { apiKey: normalized };
  }

  return {
    siteId: normalized.slice(0, index),
    apiKey: normalized.slice(index + 1),
  };
}

function resolveCredentials(): { siteId: string; apiKey: string; endpoint: string } {
  const combinedRaw = process.env.MOONCATCH_AGODA_AUTH?.trim() || process.env.AGODA_API_KEY?.trim();
  const parsed = parseCombinedCredential(combinedRaw);

  const siteId =
    process.env.MOONCATCH_AGODA_SITE_ID?.trim() ||
    process.env.AGODA_SITE_ID?.trim() ||
    process.env.AGODA_AFFILIATE_SITE_ID?.trim() ||
    parsed.siteId;

  const apiKey =
    process.env.MOONCATCH_AGODA_API_KEY?.trim() || process.env.AGODA_AFFILIATE_API_KEY?.trim() || parsed.apiKey;

  const endpoint = process.env.MOONCATCH_AGODA_SEARCH_API_URL?.trim() || DEFAULT_AGODA_SEARCH_API_URL;

  if (!siteId || !apiKey) {
    throw new AgodaSearchClientConfigError(
      'Agoda credentials required (MOONCATCH_AGODA_SITE_ID + MOONCATCH_AGODA_API_KEY or AGODA_API_KEY=siteId:apiKey)',
    );
  }

  return { siteId, apiKey, endpoint };
}

function ensureValidPropertyIds(propertyIds: bigint[]): void {
  if (propertyIds.length === 0) {
    throw new AgodaSearchRequestError('criteria.propertyIds must not be empty');
  }
  if (propertyIds.length > MAX_PROPERTY_IDS) {
    throw new AgodaSearchRequestError(`criteria.propertyIds must be <= ${MAX_PROPERTY_IDS}`);
  }
}

function uniqueExtras(extra: AgodaExtraField[] | undefined): AgodaExtraField[] {
  if (!extra || extra.length === 0) return ['rateDetail'];
  const merged = new Set<AgodaExtraField>(extra);
  merged.add('rateDetail');
  return [...merged];
}

function toHotelIdNumbers(propertyIds: bigint[]): number[] {
  return propertyIds.map((id) => {
    const asNumber = Number(id);
    if (!Number.isSafeInteger(asNumber)) {
      throw new AgodaSearchRequestError(`propertyId ${id.toString()} exceeds safe integer range`);
    }
    return asNumber;
  });
}

export function buildAgodaSearchRequest(request: AgodaSearchRequest): AgodaSearchApiPayload {
  ensureValidPropertyIds(request.criteria.propertyIds);
  const hotelId = toHotelIdNumbers(request.criteria.propertyIds);

  return {
    waitTime: request.waitTime ?? 20,
    criteria: {
      hotelId,
      checkInDate: request.criteria.checkIn,
      checkOutDate: request.criteria.checkOut,
      rooms: request.criteria.rooms,
      adults: request.criteria.adults,
      children: request.criteria.children ?? 0,
      currency: request.criteria.currency ?? 'KRW',
      language: request.criteria.language ?? 'ko-kr',
      userCountry: request.criteria.userCountry ?? 'KR',
      propertyIds: request.criteria.propertyIds.map((id) => id.toString()),
    },
    features: {
      ratesPerProperty: request.features?.ratesPerProperty ?? 25,
      extra: uniqueExtras(request.features?.extra),
    },
  };
}

export async function searchAgodaAvailability(request: AgodaSearchRequest): Promise<AgodaSearchApiResult> {
  const { siteId, apiKey, endpoint } = resolveCredentials();
  const payload = buildAgodaSearchRequest(request);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${siteId}:${apiKey}`,
        'Accept-Encoding': 'gzip,deflate',
      },
      body: JSON.stringify(payload, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
      signal: controller.signal,
    });

    if (!response.ok) {
      const responseBody = await response.text();
      throw new AgodaSearchRequestError(`Agoda Search API failed (${response.status}): ${responseBody.slice(0, 300)}`);
    }

    const json = (await response.json()) as AgodaSearchResponse;
    return {
      payload: json,
      httpStatus: response.status,
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
