import { createHash } from 'node:crypto';
import { URL } from 'node:url';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';

const requestSchema = z
  .object({
    placeName: z.string().trim().min(1),
    placeAddress: z.string().trim().optional(),
    placePostalCode: z.string().trim().optional(),
    placeInternationalPhone: z.string().trim().optional(),
    placeWebsiteUri: z.string().trim().optional(),
    latitude: z.number(),
    longitude: z.number(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    adults: z.number().int().min(1).max(20).default(2),
    rooms: z.number().int().min(1).max(8).default(1),
    radiusKm: z.number().positive().max(100).default(5),
    maxHotelCandidates: z.number().int().min(5).max(200).default(60),
    topN: z.number().int().min(1).max(2).default(2),
    maxDistanceKm: z.number().positive().max(100).optional(),
    minScore: z.number().min(0).max(1).default(0.45),
  })
  .superRefine((value, ctx): void => {
    if (value.checkIn >= value.checkOut) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'checkOut must be after checkIn',
        path: ['checkOut'],
      });
    }
  });

interface HotelbedsAvailabilityResponse {
  hotels?: {
    hotels?: Array<{
      code?: string | number;
      name?: string;
      destinationCode?: string;
      destinationName?: string;
      zoneCode?: string | number;
      zoneName?: string;
      categoryCode?: string;
      categoryName?: string;
      latitude?: string | number;
      longitude?: string | number;
      minRate?: string | number;
      maxRate?: string | number;
      currency?: string;
      rooms?: Array<{ rates?: unknown[] }>;
    }>;
  };
}

interface HotelbedsContentDetailResponse {
  hotel?: {
    postalCode?: string;
    address?: { content?: string };
    phones?: Array<{ phoneNumber?: string }>;
    web?: string;
  };
}

interface HotelDetailSignals {
  postalCode: string | null;
  address: string | null;
  phones: string[];
  websiteDomain: string | null;
}

type MatchDecision = 'CONFIRMED' | 'REVIEW' | 'UNMATCHED';
type MatchConfidence = 'high' | 'medium' | 'low';

interface MatchScoredHotel {
  score: number;
  distanceScore: number;
  nameScore: number;
  regionScore: number;
  addressScore: number;
  distanceKm: number | null;
  hasCoordinates: boolean;
  postalMatch: boolean;
  phoneMatch: boolean;
  webDomainMatch: boolean;
  decision: MatchDecision;
  confidence: MatchConfidence;
  decisionReasons: string[];
  hotel: {
    code: string | number | null;
    name: string | null;
    destinationCode: string | null;
    destinationName: string | null;
    zoneCode: string | number | null;
    zoneName: string | null;
    categoryCode: string | null;
    categoryName: string | null;
    latitude: number | null;
    longitude: number | null;
    minRate: number | string | null;
    maxRate: number | string | null;
    currency: string | null;
    roomCount: number;
    postalCode: string | null;
    address: string | null;
    phones: string[];
    websiteDomain: string | null;
  };
}

interface PlaceSignals {
  name: string;
  address: string;
  postalCode: string | null;
  phoneDigits: string | null;
  websiteDomain: string | null;
}

function getRequiredEnv(name: 'HOTELBEDS_API_KEY' | 'HOTELBEDS_SECRET'): string | null {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return null;
  return value.trim();
}

function buildSignature(apiKey: string, secret: string, timestamp: string): string {
  return createHash('sha256').update(`${apiKey}${secret}${timestamp}`).digest('hex');
}

function signedHeaders(apiKey: string, secret: string): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  return {
    Accept: 'application/json',
    'Api-key': apiKey,
    'X-Signature': buildSignature(apiKey, secret, timestamp),
  };
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NAME_STOP_WORDS = new Set([
  'hotel',
  'hotels',
  'lodging',
  'resort',
  'resorts',
  'hostel',
  'hostels',
  'motel',
  'motels',
  'guesthouse',
  'guesthouses',
  'suite',
  'suites',
  'apartment',
  'apartments',
  'villa',
  'villas',
  'stay',
  'stays',
  'room',
  'rooms',
  '호텔',
  '모텔',
  '리조트',
  '게스트하우스',
  '숙소',
]);

function tokenize(input: string, removeStopWords: boolean): string[] {
  const tokens = normalizeText(input)
    .split(' ')
    .map((token): string => token.trim())
    .filter((token): boolean => token.length > 1);

  if (!removeStopWords) return tokens;
  return tokens.filter((token): boolean => !NAME_STOP_WORDS.has(token));
}

function textSimilarity(aRaw: string, bRaw: string, removeStopWords: boolean): number {
  const aNorm = normalizeText(aRaw);
  const bNorm = normalizeText(bRaw);
  if (!aNorm || !bNorm) return 0;

  const aTokens = new Set(tokenize(aRaw, removeStopWords));
  const bTokens = new Set(tokenize(bRaw, removeStopWords));

  if (aTokens.size === 0 || bTokens.size === 0) {
    return aNorm.includes(bNorm) || bNorm.includes(aNorm) ? 0.8 : 0;
  }

  const intersection = [...aTokens].filter((token): boolean => bTokens.has(token)).length;
  const union = new Set([...aTokens, ...bTokens]).size;

  const coverageA = intersection / aTokens.size;
  const coverageB = intersection / bTokens.size;
  const jaccard = union > 0 ? intersection / union : 0;
  const containsBonus = aNorm.includes(bNorm) || bNorm.includes(aNorm) ? 0.15 : 0;

  return Math.min(1, coverageA * 0.45 + coverageB * 0.25 + jaccard * 0.3 + containsBonus);
}

function normalizePostalCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const normalized = input.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function digitsOnly(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

function extractDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const parsed = new URL(/^https?:\/\//.test(input) ? input : `https://${input}`);
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    return hostname.length > 0 ? hostname : null;
  } catch {
    return null;
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function scoreHotels(
  placeName: string,
  placeAddress: string | undefined,
  placeLat: number,
  placeLng: number,
  radiusKm: number,
  hotels: HotelbedsAvailabilityResponse['hotels'],
): MatchScoredHotel[] {
  const items = hotels?.hotels ?? [];
  const regionSource = `${placeAddress ?? ''} ${placeName}`.trim();

  return items
    .map((hotel): MatchScoredHotel => {
      const hotelLat = toNumberOrNull(hotel.latitude);
      const hotelLng = toNumberOrNull(hotel.longitude);
      const hasCoordinates = hotelLat !== null && hotelLng !== null;
      const distanceKm = hasCoordinates
        ? haversineKm(placeLat, placeLng, hotelLat as number, hotelLng as number)
        : null;
      const distanceScore = distanceKm === null ? 0 : Math.max(0, Math.min(1, 1 - distanceKm / Math.max(1, radiusKm)));

      const nameScore = textSimilarity(placeName, hotel.name ?? '', true);
      const regionTarget = `${hotel.destinationName ?? ''} ${hotel.zoneName ?? ''}`.trim();
      const regionScore = regionTarget.length > 0 ? textSimilarity(regionSource, regionTarget, false) : 0;

      const minRateNumber = hotel.minRate === undefined ? null : Number(hotel.minRate);
      const maxRateNumber = hotel.maxRate === undefined ? null : Number(hotel.maxRate);

      return {
        score: Math.round((distanceScore * 0.55 + nameScore * 0.3 + regionScore * 0.15) * 1000) / 1000,
        distanceScore: Math.round(distanceScore * 1000) / 1000,
        nameScore: Math.round(nameScore * 1000) / 1000,
        regionScore: Math.round(regionScore * 1000) / 1000,
        addressScore: 0,
        distanceKm: distanceKm === null ? null : Math.round(distanceKm * 1000) / 1000,
        hasCoordinates,
        postalMatch: false,
        phoneMatch: false,
        webDomainMatch: false,
        decision: 'UNMATCHED',
        confidence: 'low',
        decisionReasons: [],
        hotel: {
          code: hotel.code ?? null,
          name: hotel.name ?? null,
          destinationCode: hotel.destinationCode ?? null,
          destinationName: hotel.destinationName ?? null,
          zoneCode: hotel.zoneCode ?? null,
          zoneName: hotel.zoneName ?? null,
          categoryCode: hotel.categoryCode ?? null,
          categoryName: hotel.categoryName ?? null,
          latitude: hotelLat,
          longitude: hotelLng,
          minRate: Number.isFinite(minRateNumber) ? minRateNumber : (hotel.minRate ?? null),
          maxRate: Number.isFinite(maxRateNumber) ? maxRateNumber : (hotel.maxRate ?? null),
          currency: hotel.currency ?? null,
          roomCount: Array.isArray(hotel.rooms) ? hotel.rooms.length : 0,
          postalCode: null,
          address: null,
          phones: [],
          websiteDomain: null,
        },
      };
    })
    .sort((a, b): number => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return 0;
    });
}

async function fetchHotelDetailSignals(
  baseUrl: string,
  apiKey: string,
  secret: string,
  hotelCode: string | number,
): Promise<HotelDetailSignals | null> {
  const url = `${baseUrl}/hotel-content-api/1.0/hotels/${encodeURIComponent(String(hotelCode))}/details?language=ENG&useSecondaryLanguage=false`;

  try {
    const response = await fetch(url, {
      headers: signedHeaders(apiKey, secret),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const parsed = (await response.json()) as HotelbedsContentDetailResponse;
    const hotel = parsed.hotel;
    if (!hotel) return null;

    return {
      postalCode: hotel.postalCode?.trim() || null,
      address: hotel.address?.content?.trim() || null,
      phones: Array.isArray(hotel.phones)
        ? hotel.phones
            .map((phone): string | null => (phone.phoneNumber ? phone.phoneNumber.trim() : null))
            .filter((phone): phone is string => Boolean(phone))
        : [],
      websiteDomain: extractDomain(hotel.web ?? null),
    };
  } catch {
    return null;
  }
}

function classifyCandidate(candidate: MatchScoredHotel): {
  decision: MatchDecision;
  confidence: MatchConfidence;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (candidate.distanceKm !== null && candidate.distanceKm <= 0.2) reasons.push('very_close_distance');
  if (candidate.nameScore >= 0.75) reasons.push('high_name_similarity');
  if (candidate.postalMatch) reasons.push('postal_code_match');
  if (candidate.phoneMatch) reasons.push('phone_match');
  if (candidate.webDomainMatch) reasons.push('website_domain_match');
  if (candidate.regionScore >= 0.4) reasons.push('region_similarity');

  const confirmed =
    (candidate.postalMatch && candidate.phoneMatch) ||
    (candidate.distanceKm !== null && candidate.distanceKm <= 0.2 && candidate.nameScore >= 0.7) ||
    (candidate.nameScore >= 0.9 && (candidate.postalMatch || candidate.phoneMatch || candidate.webDomainMatch));
  if (confirmed) {
    return {
      decision: 'CONFIRMED',
      confidence: 'high',
      reasons: reasons.length > 0 ? reasons : ['confirmed_rule_match'],
    };
  }

  const review =
    candidate.score >= 0.45 ||
    (candidate.distanceKm !== null && candidate.distanceKm <= 1.0 && candidate.nameScore >= 0.35) ||
    candidate.postalMatch ||
    candidate.phoneMatch;

  if (review) {
    return {
      decision: 'REVIEW',
      confidence: 'medium',
      reasons: reasons.length > 0 ? reasons : ['review_rule_match'],
    };
  }

  return {
    decision: 'UNMATCHED',
    confidence: 'low',
    reasons: reasons.length > 0 ? reasons : ['weak_signals'],
  };
}

function enrichCandidateWithSignals(
  item: MatchScoredHotel,
  detail: HotelDetailSignals | null,
  place: PlaceSignals,
): MatchScoredHotel {
  const addressScore = detail?.address ? textSimilarity(place.address, detail.address, false) : 0;
  const postalMatch =
    normalizePostalCode(place.postalCode) !== null &&
    normalizePostalCode(place.postalCode) === normalizePostalCode(detail?.postalCode ?? null);

  const placePhone = place.phoneDigits;
  const phoneMatch =
    Boolean(placePhone) &&
    Array.isArray(detail?.phones) &&
    detail.phones.some((phone): boolean => {
      const hotelPhone = digitsOnly(phone);
      if (!placePhone || !hotelPhone) return false;
      const shortPlace = placePhone.slice(-8);
      const shortHotel = hotelPhone.slice(-8);
      return shortPlace.length > 0 && shortHotel.length > 0 && (shortPlace === shortHotel || placePhone === hotelPhone);
    });

  const webDomainMatch = Boolean(
    place.websiteDomain && detail?.websiteDomain && place.websiteDomain === detail.websiteDomain,
  );

  const weightedScore =
    item.distanceScore * 0.45 +
    item.nameScore * 0.23 +
    item.regionScore * 0.1 +
    addressScore * 0.08 +
    (postalMatch ? 0.08 : 0) +
    (phoneMatch ? 0.04 : 0) +
    (webDomainMatch ? 0.02 : 0);

  const enriched: MatchScoredHotel = {
    ...item,
    score: Math.round(weightedScore * 1000) / 1000,
    addressScore: Math.round(addressScore * 1000) / 1000,
    postalMatch,
    phoneMatch,
    webDomainMatch,
    hotel: {
      ...item.hotel,
      postalCode: detail?.postalCode ?? null,
      address: detail?.address ?? null,
      phones: detail?.phones ?? [],
      websiteDomain: detail?.websiteDomain ?? null,
    },
  };

  const decision = classifyCandidate(enriched);
  return {
    ...enriched,
    decision: decision.decision,
    confidence: decision.confidence,
    decisionReasons: decision.reasons,
  };
}

// POST /api/admin/hotelbeds/match-code
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = getRequiredEnv('HOTELBEDS_API_KEY');
  const secret = getRequiredEnv('HOTELBEDS_SECRET');
  if (!apiKey || !secret) {
    return NextResponse.json(
      {
        success: false,
        error: 'HOTELBEDS_API_KEY / HOTELBEDS_SECRET 환경변수가 필요합니다.',
      },
      { status: 500 },
    );
  }

  const startedAt = Date.now();

  try {
    const body = await request.json();
    const input = requestSchema.parse(body);

    const bookingBaseUrl = (process.env.HOTELBEDS_BASE_URL ?? 'https://api.test.hotelbeds.com').replace(/\/$/, '');
    const contentBaseUrl = (process.env.HOTELBEDS_CONTENT_BASE_URL ?? bookingBaseUrl).replace(/\/$/, '');
    const endpoint = `${bookingBaseUrl}/hotel-api/1.0/hotels`;

    const placeSignals: PlaceSignals = {
      name: input.placeName,
      address: input.placeAddress ?? '',
      postalCode: input.placePostalCode ?? null,
      phoneDigits: digitsOnly(input.placeInternationalPhone ?? null),
      websiteDomain: extractDomain(input.placeWebsiteUri ?? null),
    };

    const hotelbedsRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...signedHeaders(apiKey, secret),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stay: {
          checkIn: input.checkIn,
          checkOut: input.checkOut,
        },
        occupancies: [
          {
            rooms: input.rooms,
            adults: input.adults,
            children: 0,
          },
        ],
        geolocation: {
          latitude: input.latitude,
          longitude: input.longitude,
          radius: input.radiusKm,
          unit: 'km',
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });

    const rawText = await hotelbedsRes.text();
    if (!hotelbedsRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Hotelbeds API 오류 (${hotelbedsRes.status})`,
          body: rawText.slice(0, 500),
        },
        { status: 400 },
      );
    }

    const parsed = JSON.parse(rawText) as HotelbedsAvailabilityResponse;
    const allHotels = parsed.hotels?.hotels ?? [];
    const slicedHotels = { hotels: allHotels.slice(0, input.maxHotelCandidates) };
    const baseScored = scoreHotels(
      input.placeName,
      input.placeAddress,
      input.latitude,
      input.longitude,
      input.radiusKm,
      slicedHotels,
    );

    const detailTargetCodes = [
      ...new Set(
        baseScored
          .slice(0, Math.min(12, baseScored.length))
          .map((item): string | null => (item.hotel.code === null ? null : String(item.hotel.code)))
          .filter((code): code is string => Boolean(code)),
      ),
    ];

    const detailEntries = await Promise.all(
      detailTargetCodes.map(async (code): Promise<[string, HotelDetailSignals | null]> => {
        const detail = await fetchHotelDetailSignals(contentBaseUrl, apiKey, secret, code);
        return [code, detail];
      }),
    );
    const detailMap = new Map<string, HotelDetailSignals | null>(detailEntries);

    const scored = baseScored
      .map((item): MatchScoredHotel => {
        const code = item.hotel.code === null ? null : String(item.hotel.code);
        const detail = code ? (detailMap.get(code) ?? null) : null;
        return enrichCandidateWithSignals(item, detail, placeSignals);
      })
      .sort((a, b): number => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.decision !== b.decision) {
          const order: Record<MatchDecision, number> = { CONFIRMED: 3, REVIEW: 2, UNMATCHED: 1 };
          return order[b.decision] - order[a.decision];
        }
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return 0;
      });

    const maxDistanceKm = input.maxDistanceKm ?? input.radiusKm;
    const strictFiltered = scored.filter((item): boolean => {
      const distanceOk = item.distanceKm === null ? item.decision === 'CONFIRMED' : item.distanceKm <= maxDistanceKm;
      return distanceOk && item.score >= input.minScore && item.decision !== 'UNMATCHED';
    });

    let filterMode: 'strict' | 'relaxed' | 'score-fallback' | 'distance-fallback' | 'no-coordinate-fallback' = 'strict';
    let matches = strictFiltered;

    if (matches.length === 0) {
      filterMode = 'relaxed';
      const relaxedMinScore = Math.max(0, input.minScore - 0.15);
      matches = scored.filter((item): boolean => item.score >= relaxedMinScore && item.decision !== 'UNMATCHED');
    }

    if (matches.length === 0) {
      filterMode = 'score-fallback';
      matches = scored.filter((item): boolean => item.decision !== 'UNMATCHED');
    }

    if (matches.length === 0) {
      filterMode = 'distance-fallback';
      matches = scored.filter((item): boolean => item.hasCoordinates);
    }

    if (matches.length === 0) {
      filterMode = 'no-coordinate-fallback';
      matches = scored;
    }

    const topMatches = matches.slice(0, input.topN);
    const noCoordinateCount = scored.filter((item): boolean => !item.hasCoordinates).length;

    const decisionSummary = {
      confirmed: topMatches.filter((item): boolean => item.decision === 'CONFIRMED').length,
      review: topMatches.filter((item): boolean => item.decision === 'REVIEW').length,
      unmatched: topMatches.filter((item): boolean => item.decision === 'UNMATCHED').length,
    };

    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startedAt,
      place: {
        name: input.placeName,
        address: input.placeAddress ?? null,
        postalCode: input.placePostalCode ?? null,
        internationalPhone: input.placeInternationalPhone ?? null,
        websiteDomain: placeSignals.websiteDomain,
        latitude: input.latitude,
        longitude: input.longitude,
      },
      totalHotels: allHotels.length,
      usedHotels: slicedHotels.hotels.length,
      strictFilteredCount: strictFiltered.length,
      filteredCount: matches.length,
      noCoordinateCount,
      contentDetailsFetched: detailEntries.filter((entry): boolean => entry[1] !== null).length,
      filterMode,
      decisionSummary,
      thresholds: {
        radiusKm: input.radiusKm,
        maxDistanceKm,
        minScore: input.minScore,
        weights: {
          distance: 0.45,
          name: 0.23,
          region: 0.1,
          address: 0.08,
          postal: 0.08,
          phone: 0.04,
          web: 0.02,
        },
      },
      matches: topMatches,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
