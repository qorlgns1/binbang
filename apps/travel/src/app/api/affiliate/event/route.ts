import { AffiliateAdvertiserCategory, AffiliateEventType } from '@workspace/db';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = await getServerSession(authOptions);
  const sessionId = await extractSessionIdFromRequest({
    bodySessionId: parsed.data.sessionId,
    headerSessionId: req.headers.get('x-travel-session-id'),
    generateIfMissing: false,
  });

  if (parsed.data.conversationId) {
    const conversation = await getConversationOwnership(parsed.data.conversationId);
    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isOwner = conversation.userId
      ? conversation.userId === session?.user?.id
      : sessionId != null && conversation.sessionId === sessionId;

    if (!isOwner) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const result = await createAffiliateEvent({
      conversationId: parsed.data.conversationId,
      userId: session?.user?.id,
      userTimezone: parsed.data.userTimezone,
      provider: parsed.data.provider,
      eventType: parsed.data.eventType,
      reasonCode: parsed.data.reasonCode,
      productId: parsed.data.productId,
      productName: parsed.data.productName,
      category: parsed.data.category,
      isCtaEnabled: parsed.data.isCtaEnabled,
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        created: result.created,
        deduped: result.deduped,
        eventId: result.id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Failed to create affiliate event:', error);
    return new Response(JSON.stringify({ error: 'Failed to create affiliate event' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
