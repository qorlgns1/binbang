import { ConversationAffiliateOverride } from '@workspace/db';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import {
  getConversationAffiliatePreference,
  upsertConversationAffiliatePreference,
} from '@/services/conversation-preference.service';

const patchBodySchema = z.object({
  affiliateOverride: z.nativeEnum(ConversationAffiliateOverride),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id: conversationId } = await params;
  const preference = await getConversationAffiliatePreference(conversationId, session.user.id);

  if (!preference) {
    return new Response(JSON.stringify({ error: 'Not found or unauthorized' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(preference), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id: conversationId } = await params;

  const updated = await upsertConversationAffiliatePreference({
    conversationId,
    actorUserId: session.user.id,
    nextOverride: parsed.data.affiliateOverride,
  });

  if (!updated) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(updated), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
