import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getConversationsByUser } from '@/services/conversation.service';

/**
 * 사용자의 대화 목록 조회
 * GET /api/conversations
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const conversations = await getConversationsByUser(session.user.id);

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
    console.error('Failed to fetch conversations:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch conversations',
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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const conversationId = url.searchParams.get('id');

  if (!conversationId) {
    return new Response(JSON.stringify({ error: 'Conversation ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prisma } = await import('@workspace/db');

    // 소유권 확인
    const conversation = await prisma.travelConversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });

    if (!conversation || conversation.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.travelConversation.delete({
      where: { id: conversationId },
    });

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete conversation',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
