import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { jsonError, jsonResponse } from '@/lib/httpResponse';
import {
  getAccountAffiliateLinksEnabled,
  setAccountAffiliateLinksEnabled,
} from '@/services/conversation-preference.service';

const patchBodySchema = z.object({
  affiliateLinksEnabled: z.boolean(),
});

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return jsonResponse({
      affiliateLinksEnabled: true,
      source: 'default',
    });
  }

  const enabled = await getAccountAffiliateLinksEnabled(session.user.id);

  return jsonResponse({
    affiliateLinksEnabled: enabled ?? true,
    source: 'account',
  });
}

export async function PATCH(req: Request) {
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

  const enabled = await setAccountAffiliateLinksEnabled(session.user.id, parsed.data.affiliateLinksEnabled);
  if (enabled == null) {
    return jsonError(404, 'User not found');
  }

  return jsonResponse({
    ok: true,
    affiliateLinksEnabled: enabled,
  });
}
