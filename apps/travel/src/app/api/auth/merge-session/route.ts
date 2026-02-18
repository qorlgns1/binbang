import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { extractSessionIdFromRequest } from '@/lib/sessionServer';
import { mergeGuestSessionToUser } from '@/services/conversation.service';

const requestSchema = z.object({
  sessionId: z.string().optional(),
});

/**
 * 게스트 세션을 로그인한 사용자 계정으로 병합
 * POST /api/auth/merge-session
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionId = await extractSessionIdFromRequest({
    bodySessionId: parsed.data.sessionId,
    headerSessionId: req.headers.get('x-travel-session-id'),
  });

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'sessionId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await mergeGuestSessionToUser(sessionId, session.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        mergedCount: result.mergedCount,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to merge session:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to merge session',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
