import { resolveRequestId } from '@/lib/requestId';
import { runTravelCachePrewarm } from '@/services/cache-prewarm.service';

function getProvidedToken(req: Request): string | null {
  const headerToken = req.headers.get('x-internal-cron-token')?.trim();
  if (headerToken) return headerToken;

  const authorization = req.headers.get('authorization')?.trim();
  if (!authorization) return null;
  if (!authorization.toLowerCase().startsWith('bearer ')) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}

export async function POST(req: Request): Promise<Response> {
  const requestId = resolveRequestId(req);
  const expectedToken = process.env.TRAVEL_INTERNAL_CRON_TOKEN?.trim();
  if (!expectedToken) {
    return Response.json(
      {
        ok: false,
        error: 'TRAVEL_INTERNAL_CRON_TOKEN is not configured',
      },
      { status: 503 },
    );
  }

  const providedToken = getProvidedToken(req);
  if (!providedToken || providedToken !== expectedToken) {
    return Response.json(
      {
        ok: false,
        error: 'Unauthorized',
      },
      { status: 401 },
    );
  }

  try {
    const result = await runTravelCachePrewarm();
    console.info('[travel/cache-prewarm] completed', result);
    return Response.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    console.error('[travel/cache-prewarm] failed', { requestId, error });
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
