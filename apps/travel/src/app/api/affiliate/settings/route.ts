import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { parseJsonBody, requireUserId } from '@/lib/apiRoute';
import { authOptions } from '@/lib/auth';
import { handleServiceError, notFoundResponse } from '@/lib/handleServiceError';
import { jsonResponse } from '@/lib/httpResponse';
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
  const requiredUser = await requireUserId();
  if ('response' in requiredUser) {
    return requiredUser.response;
  }

  const parsedBody = await parseJsonBody(req, patchBodySchema);
  if ('response' in parsedBody) {
    return parsedBody.response;
  }

  try {
    const enabled = await setAccountAffiliateLinksEnabled(requiredUser.userId, parsedBody.data.affiliateLinksEnabled);
    if (enabled == null) {
      return notFoundResponse('User not found');
    }

    return jsonResponse({
      ok: true,
      affiliateLinksEnabled: enabled,
    });
  } catch (error) {
    return handleServiceError(error, 'affiliate/settings PATCH');
  }
}
