import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { resolveRequestId } from '@/lib/requestId';
import { createSessionId, parseSessionId, TRAVEL_SESSION_COOKIE_NAME, TRAVEL_SESSION_TTL_SECONDS } from '@/lib/session';
import { extractSessionIdFromRequest } from '@/lib/sessionServer';
import { mergeGuestSessionsToUser } from '@/services/conversation.service';

const requestSchema = z.object({
  sessionId: z.string().optional(),
  sessionIds: z.array(z.string()).optional(),
});

/**
 * 게스트 세션을 로그인한 사용자 계정으로 병합
 * POST /api/auth/merge-session
 */
export async function POST(req: Request) {
  const requestId = resolveRequestId(req);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // body 없이 호출된 경우(cookie 기반 병합)도 허용
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten(), requestId }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const extractedSessionId = await extractSessionIdFromRequest({
    bodySessionId: parsed.data.sessionId,
    headerSessionId: req.headers.get('x-travel-session-id'),
  });

  const sessionIds = new Set<string>();
  if (extractedSessionId) {
    sessionIds.add(extractedSessionId);
  }
  for (const candidate of parsed.data.sessionIds ?? []) {
    const parsedSessionId = parseSessionId(candidate);
    if (parsedSessionId) {
      sessionIds.add(parsedSessionId);
    }
  }

  if (sessionIds.size === 0) {
    return new Response(JSON.stringify({ error: 'sessionId or sessionIds is required', requestId }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await mergeGuestSessionsToUser([...sessionIds], session.user.id);
    const refreshedSessionId = createSessionId();

    const response = NextResponse.json(
      {
        success: true,
        mergedCount: result.mergedCount,
        refreshedSessionId,
        requestId,
      },
      {
        status: 200,
      },
    );
    response.cookies.set({
      name: TRAVEL_SESSION_COOKIE_NAME,
      value: refreshedSessionId,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: TRAVEL_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Failed to merge session', {
      requestId,
      userId: session.user.id,
      sessionIdCandidates: [...sessionIds],
      error,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to merge session',
        requestId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
