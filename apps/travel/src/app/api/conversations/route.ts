import { requireUserId } from '@/lib/apiRoute';
import { jsonError, jsonResponse } from '@/lib/httpResponse';
import { resolveRequestId } from '@/lib/requestId';
import { deleteConversation, getConversationsByUser } from '@/services/conversation.service';

/**
 * 사용자의 대화 목록 조회
 * GET /api/conversations
 */
export async function GET(req: Request) {
  const requestId = resolveRequestId(req);
  const requiredUser = await requireUserId({ requestId });
  if ('response' in requiredUser) {
    return requiredUser.response;
  }
  const { userId } = requiredUser;

  try {
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get('q')?.trim();
    const conversations = await getConversationsByUser(userId, searchQuery);
    return jsonResponse({ conversations });
  } catch (error) {
    console.error('Failed to fetch conversations', {
      requestId,
      userId,
      error,
    });
    return jsonError(500, 'Failed to fetch conversations', { requestId });
  }
}

/**
 * 대화 삭제
 * DELETE /api/conversations?id=xxx
 */
export async function DELETE(req: Request) {
  const requestId = resolveRequestId(req);
  const requiredUser = await requireUserId({ requestId });
  if ('response' in requiredUser) {
    return requiredUser.response;
  }
  const { userId } = requiredUser;

  const url = new URL(req.url);
  const conversationId = url.searchParams.get('id');

  if (!conversationId) {
    return jsonError(400, 'Conversation ID is required', { requestId });
  }

  try {
    const deleted = await deleteConversation(conversationId, userId);

    if (!deleted) {
      return jsonError(404, 'Not found or unauthorized', { requestId });
    }

    return jsonResponse({ success: true, requestId });
  } catch (error) {
    console.error('Failed to delete conversation', {
      requestId,
      userId,
      conversationId,
      error,
    });
    return jsonError(500, 'Failed to delete conversation', { requestId });
  }
}
