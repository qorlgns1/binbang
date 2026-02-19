import { ConversationAffiliateOverride } from '@workspace/db';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { jsonError, jsonResponse } from '@/lib/httpResponse';
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
    return jsonError(401, 'Unauthorized');
  }

  const { id: conversationId } = await params;
  const preference = await getConversationAffiliatePreference(conversationId, session.user.id);

  if (!preference) {
    return jsonError(404, 'Not found or unauthorized');
  }

  return jsonResponse(preference);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return jsonError(401, 'Unauthorized');
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON body');
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, 'Validation failed', { details: parsed.error.flatten() });
  }

  const { id: conversationId } = await params;

  const updated = await upsertConversationAffiliatePreference({
    conversationId,
    actorUserId: session.user.id,
    nextOverride: parsed.data.affiliateOverride,
  });

  if (!updated) {
    return jsonError(403, 'Forbidden');
  }

  return jsonResponse(updated);
}
