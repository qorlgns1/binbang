import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { resolveRequestId } from '@/lib/requestId';
import { getConversation, updateConversationTitle } from '@/services/conversation.service';

const patchBodySchema = z.object({
  title: z.string().trim().min(1).max(100),
});

/**
 * 대화 상세 조회
 * GET /api/conversations/:id
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = resolveRequestId(req);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id: conversationId } = await params;

  try {
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found', requestId }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 소유권 확인
    if (conversation.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        conversation,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to fetch conversation', {
      requestId,
      userId: session.user.id,
      error,
    });
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch conversation',
        requestId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

/**
 * 대화 제목 수정
 * PATCH /api/conversations/:id
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = resolveRequestId(req);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body', requestId }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsedBody = patchBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: parsedBody.error.flatten(), requestId }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const { id: conversationId } = await params;

  try {
    const updated = await updateConversationTitle(conversationId, session.user.id, parsedBody.data.title);

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Not found or unauthorized', requestId }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        conversationId,
        title: parsedBody.data.title,
        requestId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to update conversation title', {
      requestId,
      userId: session.user.id,
      error,
    });
    return new Response(
      JSON.stringify({
        error: 'Failed to update conversation title',
        requestId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
