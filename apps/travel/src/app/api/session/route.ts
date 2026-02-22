import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseJsonBody } from '@/lib/apiRoute';
import { jsonError } from '@/lib/httpResponse';
import { parseSessionId, TRAVEL_SESSION_COOKIE_NAME, TRAVEL_SESSION_TTL_SECONDS } from '@/lib/session';

const requestSchema = z.object({
  sessionId: z.string().uuid(),
});

/**
 * 게스트 sessionId를 httpOnly cookie로 동기화
 * POST /api/session
 */
export async function POST(req: Request) {
  const parsedBody = await parseJsonBody(req, requestSchema);
  if ('response' in parsedBody) {
    return parsedBody.response;
  }

  const sessionId = parseSessionId(parsedBody.data.sessionId);
  if (!sessionId) {
    return jsonError(400, 'Invalid sessionId');
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set({
    name: TRAVEL_SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TRAVEL_SESSION_TTL_SECONDS,
  });

  return response;
}
