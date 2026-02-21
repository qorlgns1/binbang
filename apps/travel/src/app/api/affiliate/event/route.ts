import { AffiliateAdvertiserCategory, AffiliateEventType } from '@workspace/db';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { parseJsonBody } from '@/lib/apiRoute';
import { authOptions } from '@/lib/auth';
import { jsonError, jsonResponse } from '@/lib/httpResponse';
import { resolveRequestId } from '@/lib/requestId';
import { extractSessionIdFromRequest } from '@/lib/sessionServer';
import { createAffiliateEvent } from '@/services/affiliate-event.service';
import { getConversationOwnership } from '@/services/conversation.service';

const bodySchema = z.object({
  conversationId: z.string().trim().min(1).optional(),
  sessionId: z.string().trim().min(1).optional(),
  provider: z.string().trim().min(1),
  eventType: z.nativeEnum(AffiliateEventType),
  reasonCode: z.enum(['no_advertiser_for_category', 'affiliate_links_disabled']).optional(),
  productId: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  category: z.nativeEnum(AffiliateAdvertiserCategory),
  isCtaEnabled: z.boolean(),
  userTimezone: z.string().trim().min(1).optional(),
  occurredAt: z.string().datetime({ offset: true }).optional(),
});

export async function POST(req: Request) {
  const requestId = resolveRequestId(req);
  const parsedBody = await parseJsonBody(req, bodySchema, { errorExtra: { requestId } });
  if ('response' in parsedBody) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  const session = await getServerSession(authOptions);
  const sessionId = await extractSessionIdFromRequest({
    bodySessionId: body.sessionId,
    headerSessionId: req.headers.get('x-travel-session-id'),
    generateIfMissing: false,
  });

  if (body.conversationId) {
    const conversation = await getConversationOwnership(body.conversationId);
    if (!conversation) {
      return jsonError(404, 'Conversation not found', { requestId });
    }

    const isOwner = conversation.userId
      ? conversation.userId === session?.user?.id
      : sessionId != null && conversation.sessionId === sessionId;

    if (!isOwner) {
      return jsonError(403, 'Unauthorized', { requestId });
    }
  }

  try {
    const result = await createAffiliateEvent({
      conversationId: body.conversationId,
      userId: session?.user?.id,
      userTimezone: body.userTimezone,
      provider: body.provider,
      eventType: body.eventType,
      reasonCode: body.reasonCode,
      productId: body.productId,
      productName: body.productName,
      category: body.category,
      isCtaEnabled: body.isCtaEnabled,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
    });

    return jsonResponse({
      ok: true,
      created: result.created,
      deduped: result.deduped,
      eventId: result.id,
      requestId,
    });
  } catch (error) {
    console.error('Failed to create affiliate event', {
      requestId,
      conversationId: body.conversationId,
      userId: session?.user?.id,
      eventType: body.eventType,
      provider: body.provider,
      error,
    });
    return jsonError(500, 'Failed to create affiliate event', { requestId });
  }
}
