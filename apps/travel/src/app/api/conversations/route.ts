import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { resolveRequestId } from '@/lib/requestId';
import { deleteConversation, getConversationsByUser } from '@/services/conversation.service';

/**
 * 사용자의 대화 목록 조회
 * GET /api/conversations
 */
export async function GET(req: Request) {
  const requestId = resolveRequestId(req);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q')?.trim();
    const conversations = await getConversationsByUser(session.user.id, searchQuery);

    return new Response(
      JSON.stringify({
        conversations,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to fetch conversations', {
      requestId,
      userId: session.user.id,
      error,
    });
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch conversations',
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
 * 대화 삭제
 * DELETE /api/conversations?id=xxx
 */
export async function DELETE(req: Request) {
  const requestId = resolveRequestId(req);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized', requestId }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const conversationId = url.searchParams.get('id');

  if (!conversationId) {
    return new Response(JSON.stringify({ error: 'Conversation ID is required', requestId }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const deleted = await deleteConversation(conversationId, session.user.id);

    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Not found or unauthorized', requestId }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        requestId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to delete conversation', {
      requestId,
      userId: session.user.id,
      conversationId,
      error,
    });
    return new Response(
      JSON.stringify({
        error: 'Failed to delete conversation',
        requestId,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
