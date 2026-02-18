import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { getConversation, updateConversationTitle } from '@/services/conversation.service';

const patchBodySchema = z.object({
  title: z.string().trim().min(1).max(100),
});

/**
 * 대화 상세 조회
 * GET /api/conversations/:id
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id: conversationId } = await params;

  try {
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 소유권 확인
    if (conversation.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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
    console.error('Failed to fetch conversation:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch conversation',
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

  const parsedBody = patchBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsedBody.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id: conversationId } = await params;

  try {
    const updated = await updateConversationTitle(conversationId, session.user.id, parsedBody.data.title);

    if (!updated) {
      return new Response(JSON.stringify({ error: 'Not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        conversationId,
        title: parsedBody.data.title,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to update conversation title:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update conversation title',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
