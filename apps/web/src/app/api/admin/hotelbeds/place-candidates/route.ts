import { NextResponse } from 'next/server';

import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';

const requestSchema = z.object({
  input: z.string().trim().min(1, 'input is required'),
  limit: z.number().int().min(1).max(5).default(5),
  debugRaw: z.boolean().optional().default(false),
});

interface PlaceCandidate {
  id: string;
  displayName: string;
  formattedAddress: string | null;
  shortFormattedAddress: string | null;
  postalCode: string | null;
  internationalPhoneNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUri: string | null;
  websiteUri: string | null;
}

interface GooglePlacesTextSearchResponse {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    shortFormattedAddress?: string;
    postalAddress?: { postalCode?: string };
    internationalPhoneNumber?: string;
    location?: { latitude?: number; longitude?: number };
    googleMapsUri?: string;
    websiteUri?: string;
  }>;
}

interface GooglePlacesErrorResponse {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{
      reason?: string;
    }>;
  };
}

interface PlacesCallResult {
  ok: boolean;
  status: number;
  rawText: string;
}

function tryBuildQueryFromUrl(rawInput: string): string | null {
  try {
    const url = new URL(rawInput);

    if (url.hostname.includes('google.') && url.pathname.includes('/maps')) {
      const q = url.searchParams.get('q');
      if (q && q.trim().length > 0) return q.trim();
    }

    const parts = url.pathname
      .split('/')
      .map((part): string => decodeURIComponent(part).trim())
      .filter(Boolean)
      .map((part): string => part.replace(/\.html?$/i, ''))
      .map((part): string => part.replace(/[-_+]/g, ' '))
      .filter((part): boolean => !['hotel', 'hotels', 'rooms', 'ko kr', 'en us'].includes(part.toLowerCase()));

    const queryFromPath = parts.find((part): boolean => part.length >= 3) ?? null;
    if (queryFromPath) return queryFromPath;

    return url.hostname.replace(/^www\./, '').split('.')[0] || null;
  } catch {
    return null;
  }
}

async function callPlacesApi(
  apiKey: string,
  textQuery: string,
  limit: number,
  fieldMask: string,
): Promise<PlacesCallResult> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      // Google Places v1은 FieldMask가 필수
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify({
      textQuery,
      languageCode: 'en',
      maxResultCount: limit,
      includedType: 'lodging',
    }),
    signal: AbortSignal.timeout(20_000),
  });

  const rawText = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    rawText,
  };
}

function parseErrorReason(rawText: string): string | null {
  try {
    const parsed = JSON.parse(rawText) as GooglePlacesErrorResponse;
    const reasons = parsed.error?.details?.map((detail): string | undefined => detail.reason).filter(Boolean);
    if (reasons && reasons.length > 0) {
      return reasons[0] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function toPlaceCandidates(places: GooglePlacesTextSearchResponse['places'], limit: number): PlaceCandidate[] {
  return (places ?? [])
    .slice(0, limit)
    .map((place): PlaceCandidate | null => {
      const id = place.id ?? null;
      const name = place.displayName?.text ?? null;
      if (!id || !name) return null;

      return {
        id,
        displayName: name,
        formattedAddress: place.formattedAddress ?? null,
        shortFormattedAddress: place.shortFormattedAddress ?? null,
        postalCode: place.postalAddress?.postalCode ?? null,
        internationalPhoneNumber: place.internationalPhoneNumber ?? null,
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
        googleMapsUri: place.googleMapsUri ?? null,
        websiteUri: place.websiteUri ?? null,
      };
    })
    .filter((candidate): candidate is PlaceCandidate => candidate !== null);
}

// POST /api/admin/hotelbeds/place-candidates
export async function POST(request: Request): Promise<Response> {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = requestSchema.parse(body);

    const serverKey = process.env.GOOGLE_PLACES_SERVER_API_KEY?.trim() || '';
    const browserKey = process.env.GOOGLE_PLACES_API_KEY?.trim() || '';
    const keyCandidates: Array<{ source: 'server' | 'browser'; value: string }> = [];
    if (serverKey.length > 0) keyCandidates.push({ source: 'server', value: serverKey });
    if (browserKey.length > 0 && browserKey !== serverKey) keyCandidates.push({ source: 'browser', value: browserKey });

    if (keyCandidates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'GOOGLE_PLACES_SERVER_API_KEY(권장) 또는 GOOGLE_PLACES_API_KEY 환경변수가 필요합니다.',
        },
        { status: 500 },
      );
    }

    const parsedQuery = tryBuildQueryFromUrl(input.input);
    const textQuery = parsedQuery && parsedQuery.length > 0 ? parsedQuery : input.input;
    const fieldMask = input.debugRaw
      ? '*'
      : 'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.postalAddress,places.internationalPhoneNumber,places.location,places.googleMapsUri,places.websiteUri';

    let lastErrorStatus = 500;
    let lastErrorText = '';
    let usedSource: 'server' | 'browser' | null = null;
    let successRawText: string | null = null;

    for (const key of keyCandidates) {
      const result = await callPlacesApi(key.value, textQuery, input.limit, fieldMask);
      if (result.ok) {
        usedSource = key.source;
        successRawText = result.rawText;
        break;
      }

      lastErrorStatus = result.status;
      lastErrorText = result.rawText;
      const reason = parseErrorReason(result.rawText);

      // 첫 키가 referrer 정책 등으로 막힌 경우에만 다음 키로 1회 fallback
      const canFallback = reason === 'API_KEY_HTTP_REFERRER_BLOCKED' || result.status === 403;
      if (!canFallback) {
        break;
      }
    }

    if (!successRawText || !usedSource) {
      let hint: string | null = null;
      if (lastErrorText.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        hint =
          '현재 키는 HTTP referrer 제한 키입니다. 서버 API에서는 referrer가 비어 있으므로 서버용 키(GOOGLE_PLACES_SERVER_API_KEY)를 사용하세요.';
      }

      return NextResponse.json(
        {
          success: false,
          error: `Google Places API 오류 (${lastErrorStatus})`,
          hint,
          body: lastErrorText.slice(0, 500),
          query: textQuery,
          attemptedSources: keyCandidates.map((candidate): string => candidate.source),
        },
        { status: 400 },
      );
    }

    const data = JSON.parse(successRawText) as GooglePlacesTextSearchResponse;
    const candidates = toPlaceCandidates(data.places, input.limit);

    return NextResponse.json({
      success: true,
      query: textQuery,
      count: candidates.length,
      candidates,
      keySource: usedSource,
      fieldMask,
      raw: input.debugRaw ? data : undefined,
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
