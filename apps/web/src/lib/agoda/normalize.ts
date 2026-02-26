import { createHash } from 'node:crypto';

interface UnknownRecord {
  [key: string]: unknown;
}

export interface NormalizedRoomOffer {
  offerKey: string;
  propertyId: bigint;
  roomId: bigint;
  ratePlanId: bigint;
  remainingRooms: number | null;
  freeCancellation: boolean | null;
  freeCancellationDate: Date | null;
  totalInclusive: number | null;
  currency: string | null;
  /** metaSearch extra 또는 hotel 레벨 URL (없으면 null) */
  landingUrl: string | null;
  payloadHash: string;
  raw: UnknownRecord;
}

export interface AgodaNormalizeResult {
  offers: NormalizedRoomOffer[];
}

const HOTEL_LIST_PATHS = [
  'results',
  'data.results',
  'hotels',
  'data.hotels',
  'result.hotels',
  'hotelResults',
  'data.hotelResults',
];

const ROOM_LIST_PATHS = ['rooms', 'roomTypes', 'roomOptions', 'roomRates'];
const RATE_LIST_PATHS = ['rates', 'ratePlans', 'rateOptions', 'offers', 'priceDetails'];
const LANDING_URL_PATHS = [
  'metaSearch.landingUrl',
  'metaSearch.deepLink',
  'metaSearch.url',
  'landingUrl',
  'deepLink',
  'bookingUrl',
  'hotelUrl',
  'url',
];

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function valueAtPath(value: unknown, path: string): unknown {
  const segments = path.split('.');
  let current: unknown = value;

  for (const segment of segments) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }

  return current;
}

function firstArray(value: unknown, paths: string[]): unknown[] | null {
  for (const path of paths) {
    const candidate = valueAtPath(value, path);
    if (Array.isArray(candidate)) return candidate;
  }
  return null;
}

function firstString(value: unknown, paths: string[]): string | null {
  for (const path of paths) {
    const candidate = valueAtPath(value, path);
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
  }
  return null;
}

function firstNumber(value: unknown, paths: string[]): number | null {
  for (const path of paths) {
    const candidate = valueAtPath(value, path);
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string') {
      const parsed = Number.parseFloat(candidate.replace(/[^\d.-]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function firstBoolean(value: unknown, paths: string[]): boolean | null {
  for (const path of paths) {
    const candidate = valueAtPath(value, path);
    if (typeof candidate === 'boolean') return candidate;
    if (typeof candidate === 'number') return candidate !== 0;
    if (typeof candidate === 'string') {
      const normalized = candidate.trim().toLowerCase();
      if (['true', 'yes', 'available'].includes(normalized)) return true;
      if (['false', 'no', 'unavailable', 'sold_out'].includes(normalized)) return false;
    }
  }
  return null;
}

function firstDate(value: unknown, paths: string[]): Date | null {
  const raw = firstString(value, paths);
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseBigIntValue(value: string | null): bigint | null {
  if (!value) return null;
  const normalized = value.replace(/[^\d-]/g, '');
  if (!normalized || normalized === '-') return null;
  try {
    return BigInt(normalized);
  } catch {
    return null;
  }
}

function pseudoBigInt(seed: string): bigint {
  const digest = createHash('sha256').update(seed).digest('hex').slice(0, 15);
  return BigInt(`0x${digest}`);
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'bigint') return JSON.stringify(value.toString());
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

function buildPayloadHash(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex');
}

function normalizeRemainingRooms(value: number | null): number | null {
  if (value == null) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

function resolveHotels(payload: unknown): unknown[] {
  const hotels = firstArray(payload, HOTEL_LIST_PATHS);
  if (hotels) return hotels;
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload)) return [payload];
  return [];
}

function resolveOffersFromHotel(hotel: unknown): Array<{ room: unknown; rate: unknown }> {
  const rooms = firstArray(hotel, ROOM_LIST_PATHS) ?? [hotel];
  const pairs: Array<{ room: unknown; rate: unknown }> = [];

  for (const room of rooms) {
    const rates = firstArray(room, RATE_LIST_PATHS) ?? [room];
    for (const rate of rates) {
      pairs.push({ room, rate });
    }
  }

  return pairs;
}

function resolveLandingUrl(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    const resolved = firstString(value, LANDING_URL_PATHS);
    if (resolved) return resolved;
  }

  return null;
}

export function normalizeAgodaSearchResponse(payload: unknown): AgodaNormalizeResult {
  const hotels = resolveHotels(payload);
  const offers: NormalizedRoomOffer[] = [];

  hotels.forEach((hotel, hotelIndex) => {
    const propertyId =
      parseBigIntValue(firstString(hotel, ['propertyId', 'hotelId', 'hotel_id', 'id'])) ??
      pseudoBigInt(`hotel:${hotelIndex}:${firstString(hotel, ['name', 'hotelName']) ?? 'unknown'}`);

    // hotel 레벨 landingUrl: metaSearch extra 또는 url 필드
    const hotelLandingUrl = resolveLandingUrl(hotel);

    const roomRatePairs = resolveOffersFromHotel(hotel);
    roomRatePairs.forEach((pair, pairIndex) => {
      const room = pair.room;
      const rate = pair.rate;
      const landingUrl = resolveLandingUrl(rate, room, hotelLandingUrl);

      const roomId =
        parseBigIntValue(firstString(room, ['roomId', 'room_id', 'id'])) ??
        pseudoBigInt(
          `room:${propertyId.toString()}:${pairIndex}:${firstString(room, ['name', 'roomName', 'title']) ?? 'unknown'}`,
        );

      const ratePlanId =
        parseBigIntValue(firstString(rate, ['ratePlanId', 'ratePlan_id', 'rateId', 'id'])) ??
        pseudoBigInt(
          `rate:${propertyId.toString()}:${roomId.toString()}:${pairIndex}:${firstString(rate, ['name', 'rateName']) ?? 'unknown'}`,
        );

      const remainingRooms = normalizeRemainingRooms(
        firstNumber(rate, ['remainingRooms', 'remaining_rooms', 'allotment']) ??
          firstNumber(room, ['remainingRooms', 'remaining_rooms', 'allotment']) ??
          firstNumber(hotel, ['remainingRooms', 'remaining_rooms']),
      );

      const freeCancellation =
        firstBoolean(rate, ['freeCancellation', 'isFreeCancellation']) ??
        firstBoolean(room, ['freeCancellation', 'isFreeCancellation']) ??
        null;

      const freeCancellationDate =
        firstDate(rate, ['freeCancellationDate', 'cancellationPolicy.freeCancellationDate']) ??
        firstDate(room, ['freeCancellationDate', 'cancellationPolicy.freeCancellationDate']) ??
        null;

      const totalInclusive =
        firstNumber(rate, ['totalPayment.inclusive', 'totalInclusive', 'inclusive', 'price.inclusive', 'dailyRate']) ??
        firstNumber(room, ['totalPayment.inclusive', 'totalInclusive', 'inclusive', 'dailyRate']) ??
        firstNumber(hotel, ['totalPayment.inclusive', 'totalInclusive', 'dailyRate']) ??
        null;

      const currency =
        firstString(rate, ['totalPayment.currency', 'currency', 'price.currency']) ??
        firstString(room, ['totalPayment.currency', 'currency']) ??
        null;

      const offerCore = {
        propertyId: propertyId.toString(),
        roomId: roomId.toString(),
        ratePlanId: ratePlanId.toString(),
        remainingRooms,
        freeCancellation,
        freeCancellationDate: freeCancellationDate?.toISOString() ?? null,
        totalInclusive,
        currency,
      };

      const payloadHash = buildPayloadHash(offerCore);
      offers.push({
        offerKey: `${propertyId.toString()}:${roomId.toString()}:${ratePlanId.toString()}`,
        propertyId,
        roomId,
        ratePlanId,
        remainingRooms,
        freeCancellation,
        freeCancellationDate,
        totalInclusive,
        currency: currency ? currency.toUpperCase() : null,
        landingUrl,
        payloadHash,
        raw: {
          hotel: isRecord(hotel) ? hotel : { value: hotel },
          room: isRecord(room) ? room : { value: room },
          rate: isRecord(rate) ? rate : { value: rate },
        },
      });
    });
  });

  const uniqueByKey = new Map<string, NormalizedRoomOffer>();
  for (const offer of offers) {
    uniqueByKey.set(offer.offerKey, offer);
  }

  return {
    offers: [...uniqueByKey.values()],
  };
}
