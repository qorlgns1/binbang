import { formatDate, type AccommodationToCheck, type CheckResult } from '@workspace/shared';
import { createHash } from 'node:crypto';

import type { CheckerRuntimeConfig } from './baseChecker';

interface HotelbedsAvailabilityResponse {
  hotels?: {
    hotels?: HotelbedsHotel[];
  };
}

interface CheckHotelbedsOptions {
  runtimeConfig?: CheckerRuntimeConfig;
}

interface HotelbedsHotel {
  code?: string | number;
  currency?: string | null;
  minRate?: number | string | null;
  rooms?: Array<{
    rates?: unknown[];
  }>;
}

function getRequiredEnv(name: 'HOTELBEDS_API_KEY' | 'HOTELBEDS_SECRET'): string | null {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function extractHotelCode(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);

    const fromQuery =
      parsed.searchParams.get('hotelCode') ??
      parsed.searchParams.get('hotelId') ??
      parsed.searchParams.get('code') ??
      null;

    if (fromQuery && fromQuery.trim().length > 0) {
      return fromQuery.trim();
    }

    return null;
  } catch {
    return null;
  }
}

function formatHotelbedsApiError(status: number, body: string): string {
  if (!body) {
    return `Hotelbeds API 오류 (${status})`;
  }

  try {
    const parsed = JSON.parse(body) as {
      error?: { code?: string; message?: string };
      errors?: Array<{ code?: string; message?: string }>;
      description?: string;
      message?: string;
    };

    const parts: string[] = [];

    if (parsed.error?.code) parts.push(`code=${parsed.error.code}`);
    if (parsed.error?.message) parts.push(parsed.error.message);
    if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
      const first = parsed.errors[0];
      if (first.code) parts.push(`code=${first.code}`);
      if (first.message) parts.push(first.message);
    }
    if (parsed.description) parts.push(parsed.description);
    if (parsed.message) parts.push(parsed.message);

    if (parts.length > 0) {
      return `Hotelbeds API 오류 (${status}): ${parts.join(' | ')}`;
    }
  } catch {
    // non-JSON 응답은 원문 일부를 그대로 노출
  }

  return `Hotelbeds API 오류 (${status}): ${body.slice(0, 300)}`;
}

function buildSignature(apiKey: string, secret: string, timestamp: string): string {
  return createHash('sha256').update(`${apiKey}${secret}${timestamp}`).digest('hex');
}

function formatPrice(minRate: string | number | null | undefined, currency: string | null | undefined): string | null {
  if (minRate === null || minRate === undefined) return null;
  const numeric = typeof minRate === 'number' ? minRate : Number(minRate);
  if (!Number.isFinite(numeric)) return null;
  const code = currency && currency.trim().length > 0 ? currency.trim().toUpperCase() : 'EUR';
  return `${code} ${numeric.toFixed(2)}`;
}

function hasRoomRate(hotel: HotelbedsHotel): boolean {
  if (!hotel || !Array.isArray(hotel.rooms)) {
    return false;
  }
  return hotel.rooms.some((room): boolean => Array.isArray(room.rates) && room.rates.length > 0);
}

export async function checkHotelbeds(
  accommodation: AccommodationToCheck,
  options: CheckHotelbedsOptions,
): Promise<CheckResult> {
  const apiKey = getRequiredEnv('HOTELBEDS_API_KEY');
  const secret = getRequiredEnv('HOTELBEDS_SECRET');

  if (!apiKey || !secret) {
    return {
      available: false,
      price: null,
      checkUrl: accommodation.url,
      error: 'HOTELBEDS_API_KEY / HOTELBEDS_SECRET 환경변수가 필요합니다.',
      retryCount: 0,
    };
  }

  const hotelCode = extractHotelCode(accommodation.url);
  if (!hotelCode) {
    return {
      available: false,
      price: null,
      checkUrl: accommodation.url,
      error: 'Hotelbeds 테스트는 URL query에 hotelCode가 필요합니다. OTA URL(Agoda/Airbnb)은 지원하지 않습니다.',
      retryCount: 0,
    };
  }

  const baseUrl = (process.env.HOTELBEDS_BASE_URL ?? 'https://api.test.hotelbeds.com').replace(/\/$/, '');
  const endpoint = `${baseUrl}/hotel-api/1.0/hotels`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = buildSignature(apiKey, secret, timestamp);

  const requestBody = {
    stay: {
      checkIn: formatDate(accommodation.checkIn),
      checkOut: formatDate(accommodation.checkOut),
    },
    occupancies: [
      {
        rooms: accommodation.rooms ?? 1,
        adults: accommodation.adults,
        children: 0,
      },
    ],
    hotels: {
      hotel: [hotelCode],
    },
  };

  const timeoutMs = options.runtimeConfig?.navigationTimeoutMs ?? 20_000;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Api-key': apiKey,
        'X-Signature': signature,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const body = await res.text().catch((): string => '');
      return {
        available: false,
        price: null,
        checkUrl: accommodation.url,
        error: formatHotelbedsApiError(res.status, body),
        retryCount: 0,
      };
    }

    const data = (await res.json()) as HotelbedsAvailabilityResponse;
    const hotels = data.hotels?.hotels ?? [];
    const matched =
      hotels.find((hotel): boolean => String(hotel.code ?? '').toLowerCase() === hotelCode.toLowerCase()) ?? hotels[0];

    if (!matched) {
      return {
        available: false,
        price: null,
        checkUrl: accommodation.url,
        error: null,
        retryCount: 0,
      };
    }

    const price = formatPrice(matched.minRate, matched.currency);
    const available = hasRoomRate(matched) || price !== null;

    return {
      available,
      price,
      checkUrl: accommodation.url,
      error: null,
      retryCount: 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      available: false,
      price: null,
      checkUrl: accommodation.url,
      error: `Hotelbeds check failed: ${message}`,
      retryCount: 0,
    };
  }
}
