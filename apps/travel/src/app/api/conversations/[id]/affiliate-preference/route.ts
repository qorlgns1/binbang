import { ConversationAffiliateOverride } from '@workspace/db';
import { z } from 'zod';

import { parseJsonBody, requireUserId } from '@/lib/apiRoute';
import { handleServiceError, notFoundResponse, unauthorizedResponse } from '@/lib/handleServiceError';
import { jsonResponse } from '@/lib/httpResponse';
import {
  getConversationAffiliatePreference,
  upsertConversationAffiliatePreference,
} from '@/services/conversation-preference.service';

const patchBodySchema = z.object({
  affiliateOverride: z.nativeEnum(ConversationAffiliateOverride),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requiredUser = await requireUserId();
  if ('response' in requiredUser) {
    return requiredUser.response;
  }

  const { id: conversationId } = await params;

  try {
    const preference = await getConversationAffiliatePreference(conversationId, requiredUser.userId);

    if (!preference) {
      return notFoundResponse('Not found or unauthorized');
    }

    return jsonResponse(preference);
  } catch (error) {
    return handleServiceError(error, 'conversations/:id/affiliate-preference GET');
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requiredUser = await requireUserId();
  if ('response' in requiredUser) {
    return requiredUser.response;
  }

  const parsedBody = await parseJsonBody(req, patchBodySchema);
  if ('response' in parsedBody) {
    return parsedBody.response;
  }

  const { id: conversationId } = await params;

  try {
    const updated = await upsertConversationAffiliatePreference({
      conversationId,
      actorUserId: requiredUser.userId,
      nextOverride: parsedBody.data.affiliateOverride,
    });

    if (!updated) {
      return unauthorizedResponse('Forbidden');
    }

    return jsonResponse(updated);
  } catch (error) {
    return handleServiceError(error, 'conversations/:id/affiliate-preference PATCH');
  }
}
