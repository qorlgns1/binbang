import { z } from 'zod';

import { parseJsonBody, requireUserId } from '@/lib/apiRoute';
import { jsonError, jsonResponse } from '@/lib/httpResponse';
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
      return jsonError(404, 'Conversation not found', { requestId });
    }

    // 소유권 확인
    if (conversation.userId !== userId) {
      return jsonError(403, 'Unauthorized', { requestId });
    }

    return jsonResponse({ conversation });
  } catch (error) {
    console.error('Failed to fetch conversation', {
      requestId,
      userId,
      error,
    });
    return jsonError(500, 'Failed to fetch conversation', { requestId });
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
      return jsonError(404, 'Not found or unauthorized', { requestId });
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
    return jsonError(500, 'Failed to update conversation title', { requestId });
  }
}
