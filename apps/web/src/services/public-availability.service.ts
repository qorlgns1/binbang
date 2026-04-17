import {
  In,
  Not,
  type Platform,
  type PredictionConfidence,
  PublicAvailabilityPrediction,
  PublicAvailabilitySnapshot,
  PublicProperty,
  getDataSource,
} from '@workspace/db';
import type { Locale } from '@workspace/shared/i18n';

const PLATFORM_SEGMENT_TO_DB = {
  airbnb: 'AIRBNB',
  agoda: 'AGODA',
} as const satisfies Record<string, Platform>;

const DB_PLATFORM_TO_SEGMENT: Record<Platform, 'airbnb' | 'agoda'> = {
  AIRBNB: 'airbnb',
  AGODA: 'agoda',
};

const DEFAULT_ALTERNATIVES_LIMIT = 4;
const MAX_ALTERNATIVES_LIMIT = 8;
const DEFAULT_LIST_ITEMS_LIMIT = 48;
const MAX_LIST_ITEMS_LIMIT = 120;
const DEFAULT_SITEMAP_ITEMS_LIMIT = 10_000;
const MAX_SITEMAP_ITEMS_LIMIT = 10_000;

export interface PublicAvailabilitySnapshotView {
  snapshotDate: string;
  windowStartAt: string;
  windowEndAt: string;
  sampleSize: number;
  availableCount: number;
  unavailableCount: number;
  errorCount: number;
  avgPriceAmount: number | null;
  minPriceAmount: number | null;
  maxPriceAmount: number | null;
  currency: string | null;
  openRate: number | null;
}

export interface PublicAvailabilityPropertyView {
  id: string;
  platform: Platform;
  slug: string;
  name: string;
  sourceUrl: string;
  imageUrl: string | null;
  description: string | null;
  countryKey: string | null;
  cityKey: string | null;
  addressRegion: string | null;
  addressLocality: string | null;
  ratingValue: number | null;
  reviewCount: number | null;
  lastObservedAt: string | null;
}

export interface PublicAvailabilityAlternativeView extends PublicAvailabilityPropertyView {
  latestSnapshot: PublicAvailabilitySnapshotView | null;
}

export interface PublicAvailabilityPredictionView {
  nextLikelyAvailableAt: string | null;
  confidence: PredictionConfidence;
  reasoning: string;
  predictedAt: string;
  algorithmVersion: string;
}

export interface PublicAvailabilityPageData {
  platform: Platform;
  platformSegment: 'airbnb' | 'agoda';
  property: PublicAvailabilityPropertyView;
  latestSnapshot: PublicAvailabilitySnapshotView | null;
  previousSnapshot: PublicAvailabilitySnapshotView | null;
  prediction: PublicAvailabilityPredictionView | null;
  alternatives: PublicAvailabilityAlternativeView[];
}

export interface PublicAvailabilityListItem {
  id: string;
  platform: Platform;
  platformSegment: 'airbnb' | 'agoda';
  slug: string;
  name: string;
  imageUrl: string | null;
  cityKey: string | null;
  addressRegion: string | null;
  addressLocality: string | null;
  lastObservedAt: string | null;
  latestSnapshot: PublicAvailabilitySnapshotView | null;
}

export interface GetPublicAvailabilityPageDataInput {
  platform: string;
  slug: string;
  alternativesLimit?: number;
}

export interface GetPublicAvailabilityListInput {
  limit?: number;
  platform?: string;
  locale?: Locale;
}

export interface PublicAvailabilitySitemapItem {
  platformSegment: 'airbnb' | 'agoda';
  slug: string;
  lastModified: string;
}

export interface GetPublicAvailabilitySitemapItemsInput {
  limit?: number;
  offset?: number;
}

export interface RegionalAggregateStats {
  avgOpenRate: number;
  avgPriceAmount: number | null;
  minPriceAmount: number | null;
  maxPriceAmount: number | null;
  currency: string | null;
  totalSampleSize: number;
}

export interface RegionalAvailabilityData {
  region: {
    key: string;
    name: string;
    propertyCount: number;
  };
  platform: Platform;
  platformSegment: 'airbnb' | 'agoda';
  aggregateStats: RegionalAggregateStats;
  topProperties: PublicAvailabilityListItem[];
}

export interface GetRegionalAvailabilityDataInput {
  platform: string;
  regionKey: string;
  limit?: number;
}

export interface RegionalSitemapItem {
  platform: Platform;
  platformSegment: 'airbnb' | 'agoda';
  regionKey: string;
  propertyCount: number;
}

export interface GetRegionalSitemapItemsInput {
  limit?: number;
}

/**
 * Locale → preferred country keys mapping.
 */
const LOCALE_PREFERRED_COUNTRIES: Record<Locale, readonly string[]> = {
  ko: ['kr', 'south korea', 'korea'],
  en: [],
  ja: ['jp', 'japan'],
  'zh-CN': ['cn', 'china'],
  'es-419': ['mx', 'mexico', 'ar', 'argentina', 'co', 'colombia'],
};

const LOCALE_BOOST_WEIGHT = 10_000;
const REVIEW_WEIGHT = 0.1;
const RATING_WEIGHT = 100;

interface ScoredListItem<T> {
  item: T;
  score: number;
}

function computeLocaleScore(
  countryKey: string | null,
  reviewCount: number | null,
  ratingValue: number | null,
  preferredCountries: readonly string[],
): number {
  let score = 0;

  if (countryKey && preferredCountries.length > 0) {
    const normalizedCountry = countryKey.trim().toLowerCase();
    if (preferredCountries.some((preferred): boolean => normalizedCountry === preferred)) {
      score += LOCALE_BOOST_WEIGHT;
    }
  }

  if (typeof reviewCount === 'number' && reviewCount > 0) {
    score += Math.min(reviewCount, 5000) * REVIEW_WEIGHT;
  }

  if (typeof ratingValue === 'number' && ratingValue > 0) {
    score += ratingValue * RATING_WEIGHT;
  }

  return score;
}

function resolveAlternativesLimit(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_ALTERNATIVES_LIMIT;
  const rounded = Math.floor(value);
  if (rounded <= 0) return DEFAULT_ALTERNATIVES_LIMIT;
  return Math.min(rounded, MAX_ALTERNATIVES_LIMIT);
}

function resolveListItemsLimit(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_LIST_ITEMS_LIMIT;
  const rounded = Math.floor(value);
  if (rounded <= 0) return DEFAULT_LIST_ITEMS_LIMIT;
  return Math.min(rounded, MAX_LIST_ITEMS_LIMIT);
}

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function buildSlugLookupCandidates(slug: string): string[] {
  const base = normalizeSlug(slug);
  if (base.length === 0) return [];

  return Array.from(
    new Set([base, base.normalize('NFC'), base.normalize('NFD'), base.normalize('NFKC'), base.normalize('NFKD')]),
  );
}

function extractSlugHashSuffix(slugCandidates: string[]): string | null {
  for (const candidate of slugCandidates) {
    const match = candidate.match(/-([a-f0-9]{8})$/i);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

function resolveSitemapItemsLimit(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return DEFAULT_SITEMAP_ITEMS_LIMIT;
  return Math.min(Math.floor(value), MAX_SITEMAP_ITEMS_LIMIT);
}

function resolveSitemapItemsOffset(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

type SnapshotRecord = {
  snapshotDate: Date;
  windowStartAt: Date;
  windowEndAt: Date;
  sampleSize: number;
  availableCount: number;
  unavailableCount: number;
  errorCount: number;
  avgPriceAmount: number | null;
  minPriceAmount: number | null;
  maxPriceAmount: number | null;
  currency: string | null;
  openRate: number | null;
};

function mapSnapshot(snapshot: SnapshotRecord | null | undefined): PublicAvailabilitySnapshotView | null {
  if (!snapshot) return null;

  return {
    snapshotDate: snapshot.snapshotDate.toISOString(),
    windowStartAt: snapshot.windowStartAt.toISOString(),
    windowEndAt: snapshot.windowEndAt.toISOString(),
    sampleSize: snapshot.sampleSize,
    availableCount: snapshot.availableCount,
    unavailableCount: snapshot.unavailableCount,
    errorCount: snapshot.errorCount,
    avgPriceAmount: snapshot.avgPriceAmount,
    minPriceAmount: snapshot.minPriceAmount,
    maxPriceAmount: snapshot.maxPriceAmount,
    currency: snapshot.currency,
    openRate: snapshot.openRate,
  };
}

function mapProperty(property: {
  id: string;
  platform: Platform;
  slug: string;
  name: string;
  sourceUrl: string;
  imageUrl: string | null;
  description: string | null;
  countryKey: string | null;
  cityKey: string | null;
  addressRegion: string | null;
  addressLocality: string | null;
  ratingValue: number | null;
  reviewCount: number | null;
  lastObservedAt: Date | null;
}): PublicAvailabilityPropertyView {
  return {
    id: property.id,
    platform: property.platform,
    slug: property.slug,
    name: property.name,
    sourceUrl: property.sourceUrl,
    imageUrl: property.imageUrl,
    description: property.description,
    countryKey: property.countryKey,
    cityKey: property.cityKey,
    addressRegion: property.addressRegion,
    addressLocality: property.addressLocality,
    ratingValue: property.ratingValue,
    reviewCount: property.reviewCount,
    lastObservedAt: property.lastObservedAt?.toISOString() ?? null,
  };
}

export function parsePublicPlatformSegment(platformSegment: string): Platform | null {
  const normalized = platformSegment.trim().toLowerCase();
  if (!(normalized in PLATFORM_SEGMENT_TO_DB)) return null;
  return PLATFORM_SEGMENT_TO_DB[normalized as keyof typeof PLATFORM_SEGMENT_TO_DB];
}

export function toPublicPlatformSegment(platform: Platform): 'airbnb' | 'agoda' {
  return DB_PLATFORM_TO_SEGMENT[platform];
}

async function loadLatestSnapshots(
  ds: Awaited<ReturnType<typeof getDataSource>>,
  propertyId: string,
  take: number,
): Promise<PublicAvailabilitySnapshot[]> {
  return ds.getRepository(PublicAvailabilitySnapshot).find({
    where: { publicPropertyId: propertyId },
    order: { snapshotDate: 'DESC' },
    take,
  });
}

async function loadLatestSnapshotsBulk(
  ds: Awaited<ReturnType<typeof getDataSource>>,
  propertyIds: string[],
): Promise<Map<string, PublicAvailabilitySnapshot>> {
  if (propertyIds.length === 0) return new Map();

  // Oracle ROW_NUMBER() to get latest snapshot per property
  const rows = await ds.query<PublicAvailabilitySnapshot[]>(
    `SELECT * FROM (
      SELECT s.*, ROW_NUMBER() OVER (PARTITION BY s."publicPropertyId" ORDER BY s."snapshotDate" DESC) AS rn
      FROM "PublicAvailabilitySnapshot" s
      WHERE s."publicPropertyId" IN (${propertyIds.map((_, i) => `:${i + 1}`).join(', ')})
    ) WHERE rn = 1`,
    propertyIds,
  );

  const map = new Map<string, PublicAvailabilitySnapshot>();
  for (const row of rows) {
    map.set(row.publicPropertyId, row);
  }
  return map;
}

export async function getPublicAvailabilityPageData(
  input: GetPublicAvailabilityPageDataInput,
): Promise<PublicAvailabilityPageData | null> {
  const platform = parsePublicPlatformSegment(input.platform);
  const slugCandidates = buildSlugLookupCandidates(input.slug);
  const slugHashSuffix = extractSlugHashSuffix(slugCandidates);

  if (!platform || slugCandidates.length === 0) return null;

  const alternativesLimit = resolveAlternativesLimit(input.alternativesLimit);
  const ds = await getDataSource();
  const propertyRepo = ds.getRepository(PublicProperty);

  let property = await propertyRepo.findOne({
    where: { platform, slug: In(slugCandidates), isActive: true },
  });

  if (!property && slugHashSuffix) {
    // Fallback: match by slug hash suffix
    const candidates = await propertyRepo
      .createQueryBuilder('p')
      .where('p."platform" = :platform AND p."isActive" = 1 AND p."slug" LIKE :suffix', {
        platform,
        suffix: `%-${slugHashSuffix}`,
      })
      .orderBy('p."updatedAt"', 'DESC')
      .take(1)
      .getMany();
    property = candidates[0] ?? null;
  }

  if (!property) return null;

  const [propertySnapshots, alternatives, latestPrediction] = await Promise.all([
    loadLatestSnapshots(ds, property.id, 2),
    propertyRepo.find({
      where: {
        platform: property.platform,
        isActive: true,
        id: Not(property.id),
        ...(property.cityKey
          ? { cityKey: property.cityKey }
          : property.countryKey
            ? { countryKey: property.countryKey }
            : {}),
      },
      order: { lastObservedAt: 'DESC', updatedAt: 'DESC' },
      take: alternativesLimit,
    }),
    ds.getRepository(PublicAvailabilityPrediction).findOne({
      where: { publicPropertyId: property.id },
      order: { predictedAt: 'DESC' },
    }),
  ]);

  const alternativeSnapshotMap = await loadLatestSnapshotsBulk(
    ds,
    alternatives.map((a) => a.id),
  );

  const prediction: PublicAvailabilityPredictionView | null = latestPrediction
    ? {
        nextLikelyAvailableAt: latestPrediction.nextLikelyAvailableAt?.toISOString() ?? null,
        confidence: latestPrediction.confidence,
        reasoning: latestPrediction.reasoning,
        predictedAt: latestPrediction.predictedAt.toISOString(),
        algorithmVersion: latestPrediction.algorithmVersion,
      }
    : null;

  return {
    platform: property.platform,
    platformSegment: toPublicPlatformSegment(property.platform),
    property: mapProperty(property),
    latestSnapshot: mapSnapshot(propertySnapshots[0]),
    previousSnapshot: mapSnapshot(propertySnapshots[1]),
    prediction,
    alternatives: alternatives.map(
      (alternative): PublicAvailabilityAlternativeView => ({
        ...mapProperty(alternative),
        latestSnapshot: mapSnapshot(alternativeSnapshotMap.get(alternative.id)),
      }),
    ),
  };
}

export async function getPublicAvailabilityList(
  input: GetPublicAvailabilityListInput = {},
): Promise<PublicAvailabilityListItem[]> {
  const limit = resolveListItemsLimit(input.limit);
  const locale = input.locale ?? null;
  const preferredCountries = locale ? (LOCALE_PREFERRED_COUNTRIES[locale] ?? []) : [];
  const hasLocaleBoost = preferredCountries.length > 0;
  const platformInput = typeof input.platform === 'string' ? input.platform : '';
  const hasPlatformInput = platformInput.trim().length > 0;
  const platform = hasPlatformInput ? parsePublicPlatformSegment(platformInput) : null;

  if (hasPlatformInput && !platform) return [];

  const fetchLimit = hasLocaleBoost ? Math.min(limit * 2, MAX_LIST_ITEMS_LIMIT) : limit;

  const ds = await getDataSource();

  const properties = await ds.getRepository(PublicProperty).find({
    where: {
      isActive: true,
      ...(platform ? { platform } : {}),
    },
    order: { lastObservedAt: 'DESC', updatedAt: 'DESC' },
    take: fetchLimit,
  });

  let filtered = properties.filter((property): boolean => property.slug.trim().length > 0);

  if (hasLocaleBoost) {
    const scored: ScoredListItem<(typeof filtered)[number]>[] = filtered.map((property) => ({
      item: property,
      score: computeLocaleScore(property.countryKey, property.reviewCount, property.ratingValue, preferredCountries),
    }));
    scored.sort((a, b): number => b.score - a.score);
    filtered = scored.slice(0, limit).map((entry) => entry.item);
  }

  const snapshotMap = await loadLatestSnapshotsBulk(
    ds,
    filtered.map((p) => p.id),
  );

  return filtered.map(
    (property): PublicAvailabilityListItem => ({
      id: property.id,
      platform: property.platform,
      platformSegment: toPublicPlatformSegment(property.platform),
      slug: property.slug,
      name: property.name,
      imageUrl: property.imageUrl,
      cityKey: property.cityKey,
      addressRegion: property.addressRegion,
      addressLocality: property.addressLocality,
      lastObservedAt: property.lastObservedAt?.toISOString() ?? null,
      latestSnapshot: mapSnapshot(snapshotMap.get(property.id)),
    }),
  );
}

export async function getPublicAvailabilitySitemapItems(
  input: GetPublicAvailabilitySitemapItemsInput = {},
): Promise<PublicAvailabilitySitemapItem[]> {
  const limit = resolveSitemapItemsLimit(input.limit);
  const offset = resolveSitemapItemsOffset(input.offset);

  const ds = await getDataSource();

  const properties = await ds.getRepository(PublicProperty).find({
    where: {
      isActive: true,
      slug: Not(''),
    },
    order: { updatedAt: 'DESC', id: 'DESC' },
    skip: offset,
    take: limit,
    select: { platform: true, slug: true, lastObservedAt: true, updatedAt: true },
  });

  return properties.map(
    (property): PublicAvailabilitySitemapItem => ({
      platformSegment: toPublicPlatformSegment(property.platform),
      slug: property.slug,
      lastModified: (property.lastObservedAt ?? property.updatedAt).toISOString(),
    }),
  );
}

export async function getPublicAvailabilitySitemapTotalCount(): Promise<number> {
  const ds = await getDataSource();
  return ds.getRepository(PublicProperty).count({
    where: {
      isActive: true,
      slug: Not(''),
    },
  });
}

export async function getRegionalAvailabilityData(
  input: GetRegionalAvailabilityDataInput,
): Promise<RegionalAvailabilityData | null> {
  const platform = parsePublicPlatformSegment(input.platform);
  const regionKey = input.regionKey.trim().toLowerCase();
  const limit = resolveListItemsLimit(input.limit);

  if (!platform || regionKey.length === 0) return null;

  const ds = await getDataSource();

  const properties = await ds.getRepository(PublicProperty).find({
    where: { platform, cityKey: regionKey, isActive: true },
    order: { lastObservedAt: 'DESC', reviewCount: 'DESC' },
    take: limit,
  });

  if (properties.length === 0) return null;

  const snapshotMap = await loadLatestSnapshotsBulk(
    ds,
    properties.map((p) => p.id),
  );

  let totalOpenRate = 0;
  let totalPrice = 0;
  let totalSampleSize = 0;
  let minPrice: number | null = null;
  let maxPrice: number | null = null;
  let currency: string | null = null;
  let validCount = 0;
  let priceValidCount = 0;

  for (const property of properties) {
    const snapshot = snapshotMap.get(property.id);
    if (!snapshot) continue;

    totalSampleSize += snapshot.sampleSize;

    if (typeof snapshot.openRate === 'number') {
      totalOpenRate += snapshot.openRate;
      validCount += 1;
    }

    if (typeof snapshot.avgPriceAmount === 'number') {
      totalPrice += snapshot.avgPriceAmount;
      priceValidCount += 1;

      if (minPrice === null || snapshot.avgPriceAmount < minPrice) {
        minPrice = snapshot.avgPriceAmount;
      }
      if (maxPrice === null || snapshot.avgPriceAmount > maxPrice) {
        maxPrice = snapshot.avgPriceAmount;
      }
    }

    if (snapshot.currency && !currency) {
      currency = snapshot.currency;
    }
  }

  const avgOpenRate = validCount > 0 ? totalOpenRate / validCount : 0;
  const avgPriceAmount = priceValidCount > 0 ? Math.round(totalPrice / priceValidCount) : null;

  return {
    region: {
      key: regionKey,
      name: regionKey,
      propertyCount: properties.length,
    },
    platform,
    platformSegment: toPublicPlatformSegment(platform),
    aggregateStats: {
      avgOpenRate,
      avgPriceAmount,
      minPriceAmount: minPrice,
      maxPriceAmount: maxPrice,
      currency,
      totalSampleSize,
    },
    topProperties: properties
      .filter((property): boolean => property.slug.trim().length > 0)
      .map(
        (property): PublicAvailabilityListItem => ({
          id: property.id,
          platform: property.platform,
          platformSegment: toPublicPlatformSegment(property.platform),
          slug: property.slug,
          name: property.name,
          imageUrl: property.imageUrl,
          cityKey: property.cityKey,
          addressRegion: property.addressRegion,
          addressLocality: property.addressLocality,
          lastObservedAt: property.lastObservedAt?.toISOString() ?? null,
          latestSnapshot: mapSnapshot(snapshotMap.get(property.id)),
        }),
      ),
  };
}

export async function getRegionalSitemapItems(
  input: GetRegionalSitemapItemsInput = {},
): Promise<RegionalSitemapItem[]> {
  const limit = input.limit ?? 50;
  const ds = await getDataSource();

  const rows = await ds.query<{ platform: Platform; cityKey: string; cnt: string }[]>(
    `SELECT "platform", "cityKey", COUNT("id") AS "cnt"
    FROM "PublicProperty"
    WHERE "isActive" = 1 AND "cityKey" IS NOT NULL
    GROUP BY "platform", "cityKey"
    ORDER BY "cnt" DESC
    FETCH FIRST :1 ROWS ONLY`,
    [limit],
  );

  return rows.map(
    (row): RegionalSitemapItem => ({
      platform: row.platform,
      platformSegment: toPublicPlatformSegment(row.platform),
      regionKey: row.cityKey,
      propertyCount: Number(row.cnt),
    }),
  );
}
