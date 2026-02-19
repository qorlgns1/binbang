import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT_MS = 10000;
const MAX_DIMENSION_PX = 4800; // Places API v1 maximum dimension

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const photoName = searchParams.get('photoName');
  const maxHeightPx = Number.parseInt(searchParams.get('maxHeightPx') ?? '400', 10);
  const maxWidthPx = Number.parseInt(searchParams.get('maxWidthPx') ?? '600', 10);

  if (!photoName) {
    return new Response('Missing photoName parameter', { status: 400 });
  }

  // Validate photoName format: places/{PLACE_ID}/photos/{PHOTO_RESOURCE}; reject reserved chars that would break URL
  if (!photoName.startsWith('places/') || !photoName.includes('/photos/') || /[?#]/.test(photoName)) {
    return new Response('Invalid photoName format', { status: 400 });
  }

  // Validate image dimensions: 1-4800 pixels (Places API v1 range)
  if (
    !Number.isFinite(maxHeightPx) ||
    !Number.isFinite(maxWidthPx) ||
    maxHeightPx < 1 ||
    maxWidthPx < 1 ||
    maxHeightPx > MAX_DIMENSION_PX ||
    maxWidthPx > MAX_DIMENSION_PX
  ) {
    return new Response('Invalid image dimensions (must be 1-4800)', { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return new Response('Server configuration error', { status: 500 });
  }

  // photoName is already URL-safe from Places API, don't double-encode
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=${maxHeightPx}&maxWidthPx=${maxWidthPx}&key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      return new Response('Failed to fetch photo', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // 1 day cache
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Place photo request timed out');
      return new Response('Request timeout', { status: 504 });
    }
    console.error('Place photo fetch error:', error);
    return new Response('Internal server error', { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
