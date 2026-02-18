import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseSessionId, TRAVEL_SESSION_COOKIE_NAME, TRAVEL_SESSION_TTL_SECONDS } from '@/lib/session';

const requestSchema = z.object({
  sessionId: z.string().uuid(),
});

/**
 * 게스트 sessionId를 httpOnly cookie로 동기화
 * POST /api/session
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const sessionId = parseSessionId(parsed.data.sessionId);
  if (!sessionId) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
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
