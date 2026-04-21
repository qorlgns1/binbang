import { AffiliateAdvertiser, type AffiliateAdvertiserCategory, getDataSource } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export type { AffiliateAdvertiserCategory };

export interface AffiliateAdvertiserItem {
  id: string;
  advertiserId: number;
  name: string;
  category: AffiliateAdvertiserCategory;
  notes: string | null;
  source: string;
  updatedAt: Date;
}

export interface UpsertFromProgrammesInput {
  programmes: Array<{ advertiserId: number; name: string }>;
}

export interface UpdateAffiliateAdvertiserInput {
  category?: AffiliateAdvertiserCategory;
  notes?: string | null;
}

// ============================================================================
// Service
// ============================================================================

export async function listAffiliateAdvertisers(
  category?: AffiliateAdvertiserCategory,
): Promise<AffiliateAdvertiserItem[]> {
  const ds = await getDataSource();
  const list = await ds.getRepository(AffiliateAdvertiser).find({
    where: category ? { category } : undefined,
    order: { category: 'ASC', name: 'ASC' },
  });
  return list as AffiliateAdvertiserItem[];
}

export async function upsertFromProgrammes(
  input: UpsertFromProgrammesInput,
): Promise<{ created: number; updated: number }> {
  if (input.programmes.length === 0) {
    return { created: 0, updated: 0 };
  }

  const ds = await getDataSource();
  const repo = ds.getRepository(AffiliateAdvertiser);
  const advertiserIds = input.programmes.map((p) => p.advertiserId);

  const existingRows = await repo
    .createQueryBuilder('a')
    .select('a.advertiserId', 'advertiserId')
    .where('a.advertiserId IN (:...advertiserIds)', { advertiserIds })
    .getRawMany<{ advertiserId: string | number }>();

  const existingIds = new Set(existingRows.map((r) => Number(r.advertiserId)));
  const existingCount = existingIds.size;

  await Promise.all(
    input.programmes.map(async (p) => {
      if (existingIds.has(p.advertiserId)) {
        await repo.update({ advertiserId: p.advertiserId }, { name: p.name, source: 'awin' });
      } else {
        const entity = repo.create({ advertiserId: p.advertiserId, name: p.name, source: 'awin' });
        await repo.save(entity);
      }
    }),
  );

  return { created: input.programmes.length - existingCount, updated: existingCount };
}

export async function updateAffiliateAdvertiser(
  id: string,
  input: UpdateAffiliateAdvertiserInput,
): Promise<AffiliateAdvertiserItem | null> {
  const ds = await getDataSource();
  const repo = ds.getRepository(AffiliateAdvertiser);

  const updateData: Partial<AffiliateAdvertiser> = {};
  if (input.category !== undefined) updateData.category = input.category;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const result = await repo.update({ id }, updateData);
  if ((result.affected ?? 0) === 0) return null;

  const one = await repo.findOne({ where: { id } });
  return one as AffiliateAdvertiserItem | null;
}

export async function getAffiliateAdvertiserById(id: string): Promise<AffiliateAdvertiserItem | null> {
  const ds = await getDataSource();
  const one = await ds.getRepository(AffiliateAdvertiser).findOne({ where: { id } });
  return one as AffiliateAdvertiserItem | null;
}
