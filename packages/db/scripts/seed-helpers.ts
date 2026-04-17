import type { DataSource, DeepPartial, FindOneOptions, ObjectLiteral, Repository } from 'typeorm';

import { getDataSource } from '../src/data-source.ts';

export async function getManagedDataSource(existing?: DataSource): Promise<{ ds: DataSource; shouldDestroy: boolean }> {
  if (existing) {
    return { ds: existing, shouldDestroy: false };
  }

  return { ds: await getDataSource(), shouldDestroy: true };
}

export async function destroyDataSource(ds: DataSource, shouldDestroy: boolean): Promise<void> {
  if (shouldDestroy && ds.isInitialized) {
    await ds.destroy();
  }
}

export async function upsertEntity<T extends ObjectLiteral>(
  repo: Repository<T>,
  findOptions: FindOneOptions<T>,
  values: DeepPartial<T>,
): Promise<T> {
  const existing = await repo.findOne(findOptions);
  if (existing) {
    return repo.save(repo.merge(existing, values));
  }
  return repo.save(repo.create(values));
}
