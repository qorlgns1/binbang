import { randomUUID } from 'node:crypto';

import { AgodaAlertEvent, getDataSource } from '@workspace/db';

export async function recordAgodaClickoutEvent(params: { accommodationId: string; url: string | null }): Promise<void> {
  const ds = await getDataSource();
  const repo = ds.getRepository(AgodaAlertEvent);
  const entity = repo.create({
    accommodationId: params.accommodationId,
    type: 'clickout',
    eventKey: `clickout:${params.accommodationId}:${randomUUID()}`,
    status: 'recorded',
    meta: { url: params.url, source: 'email' } as object,
  });
  await repo.save(entity);
}
