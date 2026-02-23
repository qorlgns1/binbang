import { z } from 'zod';

import { parseJsonBody, requireUserId } from '@/lib/apiRoute';
import { forbiddenResponse, handleServiceError, notFoundResponse } from '@/lib/handleServiceError';
import { jsonResponse } from '@/lib/httpResponse';
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
  const requiredUser = await requireUserId({ requestId });
  if ('response' in requiredUser) {
    return requiredUser.response;
  }
  const { userId } = requiredUser;

  const { id: conversationId } = await params;

  try {
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return notFoundResponse('Conversation not found');
    }

    // 소유권 확인
    if (conversation.userId !== userId) {
      return forbiddenResponse('Unauthorized');
    }

    return jsonResponse({ conversation });
  } catch (error) {
    console.error('Failed to fetch conversation', {
      requestId,
      userId,
      error,
    });
    return handleServiceError(error, 'conversations/:id GET');
  }
}

/**
 * 대화 제목 수정
 * PATCH /api/conversations/:id
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = resolveRequestId(req);
  const requiredUser = await requireUserId({ requestId });
  if ('response' in requiredUser) {
    return requiredUser.response;
  }
  const { userId } = requiredUser;

  const parsedBody = await parseJsonBody(req, patchBodySchema, { errorExtra: { requestId } });
  if ('response' in parsedBody) {
    return parsedBody.response;
  }

  const { id: conversationId } = await params;

  try {
    const updated = await updateConversationTitle(conversationId, userId, parsedBody.data.title);

    if (!updated) {
      return notFoundResponse('Not found or unauthorized');
    }

    return jsonResponse({
      success: true,
      conversationId,
      title: parsedBody.data.title,
      requestId,
    });
  } catch (error) {
    console.error('Failed to update conversation title', {
      requestId,
      userId,
      error,
    });
    return handleServiceError(error, 'conversations/:id PATCH');
  }
}
