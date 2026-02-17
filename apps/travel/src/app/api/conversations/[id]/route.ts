import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getConversation } from '@/services/conversation.service';

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
