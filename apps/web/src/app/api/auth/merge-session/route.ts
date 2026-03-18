import { NextResponse } from 'next/server';
import { z } from 'zod';

import { parseJsonBody, requireUserId } from '@/lib/apiRoute';
import { jsonError, jsonResponse } from '@/lib/httpResponse';
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
  const requiredUser = await requireUserId({ requestId });
  if ('response' in requiredUser) {
    return requiredUser.response;
  }

  const parsedBody = await parseJsonBody(req, requestSchema, {
    allowEmptyBody: true,
    errorExtra: { requestId },
  });
  if ('response' in parsedBody) {
    return parsedBody.response;
  }
  const payload = parsedBody.data;

  const extractedSessionId = await extractSessionIdFromRequest({
    bodySessionId: payload.sessionId,
    headerSessionId: req.headers.get('x-travel-session-id'),
  });

  const sessionIds = new Set<string>();
  if (extractedSessionId) {
    sessionIds.add(extractedSessionId);
  }
  for (const candidate of payload.sessionIds ?? []) {
    const parsedSessionId = parseSessionId(candidate);
    if (parsedSessionId) {
      sessionIds.add(parsedSessionId);
    }
  }

  if (sessionIds.size === 0) {
    return jsonError(400, 'sessionId or sessionIds is required', { requestId });
  }

  try {
    const result = await mergeGuestSessionsToUser([...sessionIds], requiredUser.userId);
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
      userId: requiredUser.userId,
      sessionIdCandidates: [...sessionIds],
      error,
    });
    return jsonResponse(
      {
        success: false,
        error: 'Failed to merge session',
        requestId,
      },
      { status: 500 },
    );
  }
}
