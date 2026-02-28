import { randomUUID } from 'node:crypto';

import { prisma } from '@workspace/db';

export async function recordAgodaClickoutEvent(params: { accommodationId: string; url: string | null }): Promise<void> {
  await prisma.agodaAlertEvent.create({
    data: {
      accommodationId: params.accommodationId,
      type: 'clickout',
      eventKey: `clickout:${params.accommodationId}:${randomUUID()}`,
      status: 'recorded',
      meta: { url: params.url, source: 'email' },
    },
  });
}
