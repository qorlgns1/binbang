import { createHash } from 'node:crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin';

const searchSchema = z
  .object({
    mode: z.enum(['destination', 'geolocation', 'hotelCodes']),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    adults: z.number().int().min(1).max(20).default(2),
    rooms: z.number().int().min(1).max(8).default(1),
    destinationCode: z.string().trim().min(1).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    radius: z.number().positive().max(300).default(20),
    unit: z.enum(['km', 'mi']).default('km'),
    hotelCodes: z
      .array(z.union([z.string(), z.number()]))
      .min(1)
      .max(100)
      .optional(),
    limit: z.number().int().min(1).max(100).default(30),
  })
  .superRefine((value, ctx): void => {
    if (value.mode === 'destination' && !value.destinationCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'destinationCode is required in destination mode',
        path: ['destinationCode'],
      });
    }

    if (value.mode === 'geolocation' && (value.latitude === undefined || value.longitude === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'latitude and longitude are required in geolocation mode',
        path: ['latitude'],
      });
    }

    if (value.mode === 'hotelCodes' && (!value.hotelCodes || value.hotelCodes.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'hotelCodes is required in hotelCodes mode',
        path: ['hotelCodes'],
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
      zoneCode?: number | string;
      zoneName?: string;
      categoryCode?: string;
      categoryName?: string;
      latitude?: number;
      longitude?: number;
      minRate?: number | string;
      maxRate?: number | string;
      currency?: string;
      rooms?: Array<{
        rates?: unknown[];
      }>;
    }>;
  };
  auditData?: {
    processTime?: string;
    timestamp?: string;
    token?: string;
  };
}

function getRequiredEnv(name: 'HOTELBEDS_API_KEY' | 'HOTELBEDS_SECRET'): string | null {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function buildSignature(apiKey: string, secret: string, timestamp: string): string {
  return createHash('sha256').update(`${apiKey}${secret}${timestamp}`).digest('hex');
}

function buildRequestBody(input: z.infer<typeof searchSchema>): Record<string, unknown> {
  const body: Record<string, unknown> = {
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
  };

  if (input.mode === 'destination') {
    body.destination = { code: input.destinationCode };
  }

  if (input.mode === 'geolocation') {
    body.geolocation = {
      latitude: input.latitude,
      longitude: input.longitude,
      radius: input.radius,
      unit: input.unit,
    };
  }

  if (input.mode === 'hotelCodes') {
    body.hotels = {
      hotel: (input.hotelCodes ?? []).map((code): string => String(code).trim()).filter(Boolean),
    };
  }

  return body;
}

// POST /api/admin/hotelbeds/search
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

  const startTime = Date.now();

  try {
    const body = await request.json();
    const input = searchSchema.parse(body);

    const baseUrl = (process.env.HOTELBEDS_BASE_URL ?? 'https://api.test.hotelbeds.com').replace(/\/$/, '');
    const endpoint = `${baseUrl}/hotel-api/1.0/hotels`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = buildSignature(apiKey, secret, timestamp);
    const requestBody = buildRequestBody(input);

    const hotelbedsRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Api-key': apiKey,
        'X-Signature': signature,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(45000),
    });

    const rawText = await hotelbedsRes.text();
    if (!hotelbedsRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Hotelbeds API 오류 (${hotelbedsRes.status})`,
          body: rawText.slice(0, 500),
          durationMs: Date.now() - startTime,
        },
        { status: 400 },
      );
    }

    const data = JSON.parse(rawText) as HotelbedsAvailabilityResponse;
    const hotels = data.hotels?.hotels ?? [];

    const items = hotels.slice(0, input.limit).map((hotel) => {
      const minRateNumber = hotel.minRate === undefined ? null : Number(hotel.minRate);
      const maxRateNumber = hotel.maxRate === undefined ? null : Number(hotel.maxRate);
      return {
        code: hotel.code ?? null,
        name: hotel.name ?? null,
        destinationCode: hotel.destinationCode ?? null,
        destinationName: hotel.destinationName ?? null,
        zoneCode: hotel.zoneCode ?? null,
        zoneName: hotel.zoneName ?? null,
        categoryCode: hotel.categoryCode ?? null,
        categoryName: hotel.categoryName ?? null,
        latitude: hotel.latitude ?? null,
        longitude: hotel.longitude ?? null,
        minRate: Number.isFinite(minRateNumber) ? minRateNumber : (hotel.minRate ?? null),
        maxRate: Number.isFinite(maxRateNumber) ? maxRateNumber : (hotel.maxRate ?? null),
        currency: hotel.currency ?? null,
        roomCount: Array.isArray(hotel.rooms) ? hotel.rooms.length : 0,
      };
    });

    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startTime,
      count: items.length,
      mode: input.mode,
      hotels: items,
      auditData: data.auditData ?? null,
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
