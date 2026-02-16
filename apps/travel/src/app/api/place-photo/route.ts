import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FETCH_TIMEOUT_MS = 10000;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const photoName = searchParams.get('photoName');
  const maxHeightPx = searchParams.get('maxHeightPx') ?? '400';
  const maxWidthPx = searchParams.get('maxWidthPx') ?? '600';

  if (!photoName) {
    return new Response('Missing photoName parameter', { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return new Response('Server configuration error', { status: 500 });
  }

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
