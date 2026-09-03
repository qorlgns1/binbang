import { logWarn } from '@/lib/logger';

const DEFAULT_AGODA_SEARCH_API_URL = 'https://affiliateapi7643.agoda.com/affiliateservice/lt_v1';
const SEARCH_TIMEOUT_MS = 30_000;
const MAX_PROPERTY_IDS = 100;

/**
 * 재시도 정책.
 *
 * 429(속도 초과)와 5xx만 재시도한다. 403은 쿼터 소진이나 약관 위반을 뜻하며
 * Agoda 문서상 재시도가 금지되어 있어 즉시 중단한다.
 * 타임아웃은 재시도하지 않는다. 폴링 사이클 안에서 30초 × N 을 쓰면
 * 다른 숙소의 처리 시간을 잡아먹는다.
 */
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8_000;

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
  /** 성공까지 실제로 보낸 요청 수 (재시도 없이 성공하면 1). */
  attempts: number;
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

/**
 * 403 응답 전용. 쿼터 소진 또는 약관 위반을 뜻한다.
 *
 * 재시도하면 상황을 악화시키므로 절대 재시도하지 않는다.
 * 이 에러가 보이면 사람이 확인해야 한다(제휴 계정 상태, 호출량).
 */
export class AgodaSearchForbiddenError extends AgodaSearchRequestError {
  constructor(message: string) {
    super(message);
    this.name = 'AgodaSearchForbiddenError';
  }
}

function resolveCredentials(): { siteId: string; apiKey: string; endpoint: string } {
  const siteId = process.env.AGODA_AFFILIATE_SITE_ID?.trim();
  const apiKey = process.env.AGODA_AFFILIATE_API_KEY?.trim();
  const endpoint = process.env.BINBANG_AGODA_SEARCH_API_URL?.trim() || DEFAULT_AGODA_SEARCH_API_URL;

  if (!siteId || !apiKey) {
    throw new AgodaSearchClientConfigError(
      'Agoda credentials required (AGODA_AFFILIATE_SITE_ID + AGODA_AFFILIATE_API_KEY)',
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
    },
    features: {
      ratesPerProperty: request.features?.ratesPerProperty ?? 25,
      extra: uniqueExtras(request.features?.extra),
    },
  };
}

/**
 * `Retry-After` 헤더를 밀리초로 해석한다.
 *
 * 초 단위 정수와 HTTP-date 두 형식을 모두 지원한다.
 * 해석할 수 없으면 null을 돌려주고 호출부가 지수 백오프로 대체한다.
 */
export function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value.trim());
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, MAX_BACKOFF_MS);
  }

  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) {
    return Math.min(Math.max(dateMs - Date.now(), 0), MAX_BACKOFF_MS);
  }

  return null;
}

/**
 * 지수 백오프 + 지터.
 *
 * 폴링은 여러 숙소를 연달아 처리하므로, 고정 대기만 쓰면 재시도가 한꺼번에
 * 몰린다(thundering herd). 지터로 흩뿌린다.
 */
export function computeBackoffMs(attempt: number, random: () => number = Math.random): number {
  const exponential = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
  return Math.round(exponential * (0.5 + random() * 0.5));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendOnce(
  endpoint: string,
  siteId: string,
  apiKey: string,
  payload: AgodaSearchApiPayload,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    return await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${siteId}:${apiKey}`,
        'Accept-Encoding': 'gzip,deflate',
      },
      body: JSON.stringify(payload, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function searchAgodaAvailability(request: AgodaSearchRequest): Promise<AgodaSearchApiResult> {
  const { siteId, apiKey, endpoint } = resolveCredentials();
  const payload = buildAgodaSearchRequest(request);
  const startedAt = Date.now();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await sendOnce(endpoint, siteId, apiKey, payload);

    if (response.ok) {
      const json = (await response.json()) as AgodaSearchResponse;
      return {
        payload: json,
        httpStatus: response.status,
        latencyMs: Date.now() - startedAt,
        attempts: attempt,
      };
    }

    const responseBody = (await response.text().catch(() => '')).slice(0, 300);

    // 403은 쿼터/약관 문제다. 재시도하면 악화되므로 즉시 중단한다.
    if (response.status === 403) {
      throw new AgodaSearchForbiddenError(`Agoda Search API forbidden (403): ${responseBody}`);
    }

    lastError = new AgodaSearchRequestError(`Agoda Search API failed (${response.status}): ${responseBody}`);

    if (!isRetryableStatus(response.status) || attempt === MAX_ATTEMPTS) {
      throw lastError;
    }

    const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
    const waitMs = retryAfterMs ?? computeBackoffMs(attempt);

    // 429가 반복되면 호출량이 한도에 닿고 있다는 신호다. 로그로 드러낸다.
    logWarn('agoda_search_retry', {
      status: response.status,
      attempt,
      maxAttempts: MAX_ATTEMPTS,
      waitMs,
      respectedRetryAfter: retryAfterMs !== null,
    });

    await sleep(waitMs);
  }

  // 루프는 항상 return 하거나 throw 한다. 여기 도달하면 로직 오류다.
  throw lastError ?? new AgodaSearchRequestError('Agoda Search API failed without a response');
}
