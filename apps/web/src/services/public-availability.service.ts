import { type Platform, type PredictionConfidence, type Prisma, prisma } from '@workspace/db';
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
const MAX_SITEMAP_ITEMS_LIMIT = 20_000;

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
 * Properties in preferred countries are boosted in list results.
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

function isMissingPublicPropertyTableError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const maybeCode = 'code' in error ? (error.code as string | undefined) : undefined;
  return maybeCode === 'P2021';
}

const SNAPSHOT_SELECT = {
  snapshotDate: true,
  windowStartAt: true,
  windowEndAt: true,
  sampleSize: true,
  availableCount: true,
  unavailableCount: true,
  errorCount: true,
  avgPriceAmount: true,
  minPriceAmount: true,
  maxPriceAmount: true,
  currency: true,
  openRate: true,
} as const satisfies Prisma.PublicAvailabilitySnapshotSelect;

const PROPERTY_WITH_SNAPSHOTS_SELECT = {
  id: true,
  platform: true,
  slug: true,
  name: true,
  sourceUrl: true,
  imageUrl: true,
  description: true,
  countryKey: true,
  cityKey: true,
  addressRegion: true,
  addressLocality: true,
  ratingValue: true,
  reviewCount: true,
  lastObservedAt: true,
  snapshots: {
    orderBy: { snapshotDate: 'desc' as const },
    take: 2,
    select: SNAPSHOT_SELECT,
  },
} as const satisfies Prisma.PublicPropertySelect;

const ALTERNATIVE_SELECT = {
  id: true,
  platform: true,
  slug: true,
  name: true,
  sourceUrl: true,
  imageUrl: true,
  description: true,
  addressRegion: true,
  addressLocality: true,
  ratingValue: true,
  reviewCount: true,
  lastObservedAt: true,
  snapshots: {
    orderBy: { snapshotDate: 'desc' as const },
    take: 1,
    select: SNAPSHOT_SELECT,
  },
} as const satisfies Prisma.PublicPropertySelect;

const LIST_ITEM_SELECT = {
  id: true,
  platform: true,
  slug: true,
  name: true,
  imageUrl: true,
  countryKey: true,
  addressRegion: true,
  addressLocality: true,
  ratingValue: true,
  reviewCount: true,
  lastObservedAt: true,
  snapshots: {
    orderBy: { snapshotDate: 'desc' as const },
    take: 1,
    select: SNAPSHOT_SELECT,
  },
} as const satisfies Prisma.PublicPropertySelect;

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

  // Allow lookups across common Unicode normalization forms.
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
    addressRegion: property.addressRegion,
    addressLocality: property.addressLocality,
    ratingValue: property.ratingValue,
    reviewCount: property.reviewCount,
    lastObservedAt: property.lastObservedAt?.toISOString() ?? null,
  };
}

function buildAreaFilter(input: {
  cityKey: string | null;
  countryKey: string | null;
}): Prisma.PublicPropertyWhereInput {
  if (input.cityKey) return { cityKey: input.cityKey };
  if (input.countryKey) return { countryKey: input.countryKey };
  return {};
}

export function parsePublicPlatformSegment(platformSegment: string): Platform | null {
  const normalized = platformSegment.trim().toLowerCase();
  if (!(normalized in PLATFORM_SEGMENT_TO_DB)) return null;
  return PLATFORM_SEGMENT_TO_DB[normalized as keyof typeof PLATFORM_SEGMENT_TO_DB];
}

export function toPublicPlatformSegment(platform: Platform): 'airbnb' | 'agoda' {
  return DB_PLATFORM_TO_SEGMENT[platform];
}

export async function getPublicAvailabilityPageData(
  input: GetPublicAvailabilityPageDataInput,
): Promise<PublicAvailabilityPageData | null> {
  const platform = parsePublicPlatformSegment(input.platform);
  const slugCandidates = buildSlugLookupCandidates(input.slug);
  const slugHashSuffix = extractSlugHashSuffix(slugCandidates);

  if (!platform || slugCandidates.length === 0) return null;

  const alternativesLimit = resolveAlternativesLimit(input.alternativesLimit);

  return prisma.$transaction(async (tx): Promise<PublicAvailabilityPageData | null> => {
    let property = await tx.publicProperty.findFirst({
      where: {
        platform,
        slug: { in: slugCandidates },
        isActive: true,
      },
      select: PROPERTY_WITH_SNAPSHOTS_SELECT,
    });

    if (!property && slugHashSuffix) {
      // Fallback: match by deterministic slug hash suffix to absorb Unicode normalization drifts.
      property = await tx.publicProperty.findFirst({
        where: {
          platform,
          isActive: true,
          slug: { endsWith: `-${slugHashSuffix}` },
        },
        orderBy: { updatedAt: 'desc' },
        select: PROPERTY_WITH_SNAPSHOTS_SELECT,
      });
    }

    if (!property) return null;

    const [alternatives, latestPrediction] = await Promise.all([
      tx.publicProperty.findMany({
        where: {
          platform: property.platform,
          isActive: true,
          id: { not: property.id },
          ...buildAreaFilter(property),
        },
        orderBy: [{ lastObservedAt: 'desc' }, { updatedAt: 'desc' }],
        take: alternativesLimit,
        select: ALTERNATIVE_SELECT,
      }),
      tx.publicAvailabilityPrediction.findFirst({
        where: { publicPropertyId: property.id },
        orderBy: { predictedAt: 'desc' },
        select: {
          nextLikelyAvailableAt: true,
          confidence: true,
          reasoning: true,
          predictedAt: true,
          algorithmVersion: true,
        },
      }),
    ]);

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
      latestSnapshot: mapSnapshot(property.snapshots[0]),
      previousSnapshot: mapSnapshot(property.snapshots[1]),
      prediction,
      alternatives: alternatives.map(
        (alternative): PublicAvailabilityAlternativeView => ({
          ...mapProperty(alternative),
          latestSnapshot: mapSnapshot(alternative.snapshots[0]),
        }),
      ),
    };
  });
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

  let properties: Array<{
    id: string;
    platform: Platform;
    slug: string;
    name: string;
    imageUrl: string | null;
    countryKey: string | null;
    addressRegion: string | null;
    addressLocality: string | null;
    ratingValue: number | null;
    reviewCount: number | null;
    lastObservedAt: Date | null;
    snapshots: SnapshotRecord[];
  }> = [];

  try {
    properties = await prisma.publicProperty.findMany({
      where: {
        isActive: true,
        ...(platform ? { platform } : {}),
      },
      orderBy: [{ lastObservedAt: 'desc' }, { updatedAt: 'desc' }],
      take: fetchLimit,
      select: LIST_ITEM_SELECT,
    });
  } catch (error) {
    if (isMissingPublicPropertyTableError(error)) {
      return [];
    }
    throw error;
  }

  let filtered = properties.filter((property): boolean => property.slug.trim().length > 0);

  if (hasLocaleBoost) {
    const scored: ScoredListItem<(typeof filtered)[number]>[] = filtered.map((property) => ({
      item: property,
      score: computeLocaleScore(property.countryKey, property.reviewCount, property.ratingValue, preferredCountries),
    }));
    scored.sort((a, b): number => b.score - a.score);
    filtered = scored.slice(0, limit).map((entry) => entry.item);
  }

  return filtered.map(
    (property): PublicAvailabilityListItem => ({
      id: property.id,
      platform: property.platform,
      platformSegment: toPublicPlatformSegment(property.platform),
      slug: property.slug,
      name: property.name,
      imageUrl: property.imageUrl,
      addressRegion: property.addressRegion,
      addressLocality: property.addressLocality,
      lastObservedAt: property.lastObservedAt?.toISOString() ?? null,
      latestSnapshot: mapSnapshot(property.snapshots[0]),
    }),
  );
}

export async function getPublicAvailabilitySitemapItems(
  input: GetPublicAvailabilitySitemapItemsInput = {},
): Promise<PublicAvailabilitySitemapItem[]> {
  const limit = resolveSitemapItemsLimit(input.limit);
  let properties: Array<{
    platform: Platform;
    slug: string;
    lastObservedAt: Date | null;
    updatedAt: Date;
  }> = [];

  try {
    properties = await prisma.publicProperty.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
      select: {
        platform: true,
        slug: true,
        lastObservedAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (isMissingPublicPropertyTableError(error)) {
      return [];
    }
    throw error;
  }

  return properties
    .filter((property): boolean => property.slug.trim().length > 0)
    .map(
      (property): PublicAvailabilitySitemapItem => ({
        platformSegment: toPublicPlatformSegment(property.platform),
        slug: property.slug,
        lastModified: (property.lastObservedAt ?? property.updatedAt).toISOString(),
      }),
    );
}

export async function getRegionalAvailabilityData(
  input: GetRegionalAvailabilityDataInput,
): Promise<RegionalAvailabilityData | null> {
  const platform = parsePublicPlatformSegment(input.platform);
  const regionKey = input.regionKey.trim().toLowerCase();
  const limit = resolveListItemsLimit(input.limit);

  if (!platform || regionKey.length === 0) return null;

  try {
    const properties = await prisma.publicProperty.findMany({
      where: {
        platform,
        cityKey: regionKey,
        isActive: true,
      },
      include: {
        snapshots: {
          orderBy: { snapshotDate: 'desc' },
          take: 1,
          select: SNAPSHOT_SELECT,
        },
      },
      orderBy: [{ lastObservedAt: 'desc' }, { reviewCount: 'desc' }],
      take: limit,
    });

    if (properties.length === 0) return null;

    // 집계 계산
    let totalOpenRate = 0;
    let totalPrice = 0;
    let totalSampleSize = 0;
    let minPrice: number | null = null;
    let maxPrice: number | null = null;
    let currency: string | null = null;
    let validCount = 0;

    for (const property of properties) {
      const snapshot = property.snapshots[0];
      if (!snapshot) continue;

      totalSampleSize += snapshot.sampleSize;

      if (typeof snapshot.openRate === 'number') {
        totalOpenRate += snapshot.openRate;
        validCount += 1;
      }

      if (typeof snapshot.avgPriceAmount === 'number') {
        totalPrice += snapshot.avgPriceAmount;

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
    const avgPriceAmount = validCount > 0 ? Math.round(totalPrice / validCount) : null;

    return {
      region: {
        key: regionKey,
        name: regionKey, // Will be formatted in UI
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
            addressRegion: property.addressRegion,
            addressLocality: property.addressLocality,
            lastObservedAt: property.lastObservedAt?.toISOString() ?? null,
            latestSnapshot: mapSnapshot(property.snapshots[0]),
          }),
        ),
    };
  } catch (error) {
    if (isMissingPublicPropertyTableError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getRegionalSitemapItems(
  input: GetRegionalSitemapItemsInput = {},
): Promise<RegionalSitemapItem[]> {
  const limit = input.limit ?? 50;

  try {
    const regions = await prisma.publicProperty.groupBy({
      by: ['platform', 'cityKey'],
      where: {
        isActive: true,
        cityKey: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    return regions
      .filter((region): region is typeof region & { cityKey: string } => region.cityKey !== null)
      .map(
        (region): RegionalSitemapItem => ({
          platform: region.platform,
          platformSegment: toPublicPlatformSegment(region.platform),
          regionKey: region.cityKey,
          propertyCount: region._count.id,
        }),
      );
  } catch (error) {
    if (isMissingPublicPropertyTableError(error)) {
      return [];
    }
    throw error;
  }
}
