import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { mergeGuestSessionToUser } from '@/services/conversation.service';

const requestSchema = z.object({
  sessionId: z.string().min(1),
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { sessionId } = parsed.data;

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
