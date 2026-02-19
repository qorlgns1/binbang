import { type AffiliateAdvertiserCategory, prisma } from '@workspace/db';

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

const SELECT = {
  id: true,
  advertiserId: true,
  name: true,
  category: true,
  notes: true,
  source: true,
  updatedAt: true,
} as const;

// ============================================================================
// Service
// ============================================================================

export async function listAffiliateAdvertisers(
  category?: AffiliateAdvertiserCategory,
): Promise<AffiliateAdvertiserItem[]> {
  const list = await prisma.affiliateAdvertiser.findMany({
    where: category ? { category } : undefined,
    select: SELECT,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  return list as AffiliateAdvertiserItem[];
}

export async function upsertFromProgrammes(
  input: UpsertFromProgrammesInput,
): Promise<{ created: number; updated: number }> {
  const advertiserIds = input.programmes.map((p) => p.advertiserId);
  const existingRows = await prisma.affiliateAdvertiser.findMany({
    where: { advertiserId: { in: advertiserIds } },
    select: { advertiserId: true },
  });
  const existingCount = existingRows.length;
  await prisma.$transaction(
    input.programmes.map((p) =>
      prisma.affiliateAdvertiser.upsert({
        where: { advertiserId: p.advertiserId },
        create: {
          advertiserId: p.advertiserId,
          name: p.name,
          source: 'awin',
        },
        update: { name: p.name, source: 'awin' },
      }),
    ),
  );
  return { created: input.programmes.length - existingCount, updated: existingCount };
}

export async function updateAffiliateAdvertiser(
  id: string,
  input: UpdateAffiliateAdvertiserInput,
): Promise<AffiliateAdvertiserItem | null> {
  const row = await prisma.affiliateAdvertiser.updateMany({
    where: { id },
    data: {
      ...(input.category !== undefined && { category: input.category }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
  });
  if (row.count === 0) return null;
  const one = await prisma.affiliateAdvertiser.findUnique({
    where: { id },
    select: SELECT,
  });
  return one as AffiliateAdvertiserItem;
}

export async function getAffiliateAdvertiserById(id: string): Promise<AffiliateAdvertiserItem | null> {
  const one = await prisma.affiliateAdvertiser.findUnique({
    where: { id },
    select: SELECT,
  });
  return one as AffiliateAdvertiserItem | null;
}
