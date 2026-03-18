import { requireUserId } from '@/lib/apiRoute';
import { badRequestResponse, handleServiceError, notFoundResponse } from '@/lib/handleServiceError';
import { jsonResponse } from '@/lib/httpResponse';
import { resolveRequestId } from '@/lib/requestId';
import { deleteConversation, getConversationsByUser } from '@/services/conversation.service';

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
    console.error('Failed to fetch conversations', { requestId, userId, error });
    return handleServiceError(error, 'conversations GET');
  }
}

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
    return badRequestResponse('Conversation ID is required');
  }

  try {
    const deleted = await deleteConversation(conversationId, userId);
    if (!deleted) {
      return notFoundResponse('Not found or unauthorized');
    }
    return jsonResponse({ success: true, requestId });
  } catch (error) {
    console.error('Failed to delete conversation', { requestId, userId, conversationId, error });
    return handleServiceError(error, 'conversations DELETE');
  }
}
