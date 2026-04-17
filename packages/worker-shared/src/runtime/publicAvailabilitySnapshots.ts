import { createHash } from 'node:crypto';

import type { Platform } from '@workspace/db';
import { getDataSource, PublicProperty, PublicAvailabilitySnapshot } from '@workspace/db';
import { MS_PER_DAY, startOfUtcDay, endOfUtcDay } from '@workspace/shared/utils/date';

export const DEFAULT_PUBLIC_AVAILABILITY_WINDOW_DAYS = 7;

const BATCH_SIZE = 100;

export interface RefreshPublicAvailabilitySnapshotsInput {
  now?: Date;
  windowDays?: number;
}

export interface RefreshPublicAvailabilitySnapshotsResult {
  snapshotDate: string;
  windowStartAt: string;
  windowEndAt: string;
  scannedAccommodations: number;
  upsertedProperties: number;
  upsertedSnapshots: number;
  skippedWithoutKey: number;
  queryTimeMs: number;
  aggregationTimeMs: number;
  upsertTimeMs: number;
}

interface PropertyAggregate {
  platform: Platform;
  platformPropertyKey: string;
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
  latitude: number | null;
  longitude: number | null;
  lastObservedAt: Date;
  sampleSize: number;
  availableCount: number;
  unavailableCount: number;
  errorCount: number;
  priceCount: number;
  priceSum: number;
  minPriceAmount: number | null;
  maxPriceAmount: number | null;
  currency: string | null;
}

interface AccommodationSnapshotSource {
  id: string;
  platform: Platform;
  platformId: string | null;
  url: string;
  name: string;
  platformName: string | null;
  platformImage: string | null;
  platformDescription: string | null;
  addressCountry: string | null;
  addressRegion: string | null;
  addressLocality: string | null;
  ratingValue: number | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  lastPriceCurrency: string | null;
}

interface AggregatedAccommodationRow {
  accommodationId: string;
  platform: string;
  platformId: string | null;
  url: string;
  name: string;
  platformName: string | null;
  platformImage: string | null;
  platformDescription: string | null;
  addressCountry: string | null;
  addressRegion: string | null;
  addressLocality: string | null;
  ratingValue: number | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  lastPriceCurrency: string | null;
  sampleSize: number;
  priceCount: number;
  priceSum: number;
  minPriceAmount: number | null;
  maxPriceAmount: number | null;
  availableCount: number;
  unavailableCount: number;
  errorCount: number;
}

function resolveWindowDays(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_PUBLIC_AVAILABILITY_WINDOW_DAYS;
  }
  const floored = Math.floor(value);
  return floored > 0 ? floored : DEFAULT_PUBLIC_AVAILABILITY_WINDOW_DAYS;
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

function clamp(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

function normalizeUrlForKey(value: string): string | null {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${host}${path}`;
  } catch {
    return null;
  }
}

function derivePlatformPropertyKey(accommodation: AccommodationSnapshotSource): string | null {
  const platformId = compactWhitespace(accommodation.platformId ?? '');
  if (platformId.length > 0) {
    return clamp(`id:${platformId}`, 180);
  }

  const normalizedUrl = normalizeUrlForKey(accommodation.url);
  if (!normalizedUrl) return null;

  return clamp(`url:${normalizedUrl}`, 180);
}

function buildSlug(nameCandidate: string, platformPropertyKey: string): string {
  const base = slugify(nameCandidate).slice(0, 80) || 'property';
  const suffix = createHash('sha256').update(platformPropertyKey).digest('hex').slice(0, 12);
  return `${base}-${suffix}`;
}

function toCountryKey(country: string | null): string | null {
  if (!country) return null;
  const key = slugify(country);
  return key.length > 0 ? clamp(key, 64) : null;
}

function toCityKey(locality: string | null, region: string | null): string | null {
  const source = locality ?? region;
  if (!source) return null;
  const key = slugify(source);
  return key.length > 0 ? clamp(key, 64) : null;
}

function toNameCandidate(accommodation: AccommodationSnapshotSource): string {
  const platformName = compactWhitespace(accommodation.platformName ?? '');
  const customName = compactWhitespace(accommodation.name);
  const fallback = compactWhitespace(accommodation.url);
  return platformName || customName || fallback || 'Property';
}

function getNumericOrNull(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function createAggregate(
  accommodation: AccommodationSnapshotSource,
  platformPropertyKey: string,
  now: Date,
): PropertyAggregate {
  const name = toNameCandidate(accommodation);

  return {
    platform: accommodation.platform,
    platformPropertyKey,
    slug: buildSlug(name, platformPropertyKey),
    name,
    sourceUrl: accommodation.url,
    imageUrl: accommodation.platformImage,
    description: accommodation.platformDescription,
    countryKey: toCountryKey(accommodation.addressCountry),
    cityKey: toCityKey(accommodation.addressLocality, accommodation.addressRegion),
    addressRegion: accommodation.addressRegion,
    addressLocality: accommodation.addressLocality,
    ratingValue: getNumericOrNull(accommodation.ratingValue),
    reviewCount: accommodation.reviewCount ?? null,
    latitude: getNumericOrNull(accommodation.latitude),
    longitude: getNumericOrNull(accommodation.longitude),
    lastObservedAt: now,
    sampleSize: 0,
    availableCount: 0,
    unavailableCount: 0,
    errorCount: 0,
    priceCount: 0,
    priceSum: 0,
    minPriceAmount: null,
    maxPriceAmount: null,
    currency: accommodation.lastPriceCurrency ?? null,
  };
}

function mergeMetadata(target: PropertyAggregate, accommodation: AccommodationSnapshotSource): void {
  const candidateName = toNameCandidate(accommodation);
  if (target.name.length < candidateName.length) {
    target.name = candidateName;
    target.slug = buildSlug(target.name, target.platformPropertyKey);
  }

  if (!target.imageUrl && accommodation.platformImage) {
    target.imageUrl = accommodation.platformImage;
  }
  if (!target.description && accommodation.platformDescription) {
    target.description = accommodation.platformDescription;
  }
  if (!target.countryKey) {
    target.countryKey = toCountryKey(accommodation.addressCountry);
  }
  if (!target.cityKey) {
    target.cityKey = toCityKey(accommodation.addressLocality, accommodation.addressRegion);
  }
  if (!target.addressRegion && accommodation.addressRegion) {
    target.addressRegion = accommodation.addressRegion;
  }
  if (!target.addressLocality && accommodation.addressLocality) {
    target.addressLocality = accommodation.addressLocality;
  }

  if (typeof accommodation.ratingValue === 'number' && Number.isFinite(accommodation.ratingValue)) {
    target.ratingValue =
      target.ratingValue == null ? accommodation.ratingValue : Math.max(target.ratingValue, accommodation.ratingValue);
  }
  if (typeof accommodation.reviewCount === 'number') {
    target.reviewCount =
      target.reviewCount == null ? accommodation.reviewCount : Math.max(target.reviewCount, accommodation.reviewCount);
  }
  if (target.latitude == null && typeof accommodation.latitude === 'number') {
    target.latitude = accommodation.latitude;
  }
  if (target.longitude == null && typeof accommodation.longitude === 'number') {
    target.longitude = accommodation.longitude;
  }

  const currency = accommodation.lastPriceCurrency ?? null;
  if (target.currency == null) {
    target.currency = currency;
  } else if (currency && target.currency !== currency) {
    target.currency = null;
  }
}

function safeOpenRate(availableCount: number, sampleSize: number): number {
  if (sampleSize <= 0) return 0;
  return Math.round((availableCount / sampleSize) * 1000) / 1000;
}

function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function toAccommodationSource(row: AggregatedAccommodationRow): AccommodationSnapshotSource {
  return {
    id: row.accommodationId,
    platform: row.platform as Platform,
    platformId: row.platformId,
    url: row.url,
    name: row.name,
    platformName: row.platformName,
    platformImage: row.platformImage,
    platformDescription: row.platformDescription,
    addressCountry: row.addressCountry,
    addressRegion: row.addressRegion,
    addressLocality: row.addressLocality,
    ratingValue: row.ratingValue,
    reviewCount: row.reviewCount,
    latitude: row.latitude,
    longitude: row.longitude,
    lastPriceCurrency: row.lastPriceCurrency,
  };
}

export async function refreshPublicAvailabilitySnapshots(
  input: RefreshPublicAvailabilitySnapshotsInput = {},
): Promise<RefreshPublicAvailabilitySnapshotsResult> {
  const now = input.now ?? new Date();
  const windowDays = resolveWindowDays(input.windowDays);
  const snapshotDate = startOfUtcDay(now);
  const windowEndAt = endOfUtcDay(now);
  const windowStartAt = startOfUtcDay(new Date(snapshotDate.getTime() - (windowDays - 1) * MS_PER_DAY));
  const ds = await getDataSource();

  const emptyResult: RefreshPublicAvailabilitySnapshotsResult = {
    snapshotDate: snapshotDate.toISOString(),
    windowStartAt: windowStartAt.toISOString(),
    windowEndAt: windowEndAt.toISOString(),
    scannedAccommodations: 0,
    upsertedProperties: 0,
    upsertedSnapshots: 0,
    skippedWithoutKey: 0,
    queryTimeMs: 0,
    aggregationTimeMs: 0,
    upsertTimeMs: 0,
  };

  // Step 1: Oracle SQL - CheckLog + Accommodation JOIN + GROUP BY
  // Oracle은 GROUP BY에 모든 비집계 컬럼을 명시해야 함
  const queryStart = Date.now();
  const rows = await ds.query<AggregatedAccommodationRow[]>(
    `SELECT
      a."id"                    AS "accommodationId",
      a."platform"              AS "platform",
      a."platformId"            AS "platformId",
      a."url"                   AS "url",
      a."name"                  AS "name",
      a."platformName"          AS "platformName",
      a."platformImage"         AS "platformImage",
      a."platformDescription"   AS "platformDescription",
      a."addressCountry"        AS "addressCountry",
      a."addressRegion"         AS "addressRegion",
      a."addressLocality"       AS "addressLocality",
      a."ratingValue"           AS "ratingValue",
      a."reviewCount"           AS "reviewCount",
      a."latitude"              AS "latitude",
      a."longitude"             AS "longitude",
      a."lastPriceCurrency"     AS "lastPriceCurrency",
      COUNT(cl."id")            AS "sampleSize",
      COUNT(cl."priceAmount")   AS "priceCount",
      COALESCE(SUM(cl."priceAmount"), 0) AS "priceSum",
      MIN(cl."priceAmount")     AS "minPriceAmount",
      MAX(cl."priceAmount")     AS "maxPriceAmount",
      SUM(CASE WHEN cl."status" = 'AVAILABLE'   THEN 1 ELSE 0 END) AS "availableCount",
      SUM(CASE WHEN cl."status" = 'UNAVAILABLE' THEN 1 ELSE 0 END) AS "unavailableCount",
      SUM(CASE WHEN cl."status" = 'ERROR'       THEN 1 ELSE 0 END) AS "errorCount"
    FROM "CheckLog" cl
    JOIN "Accommodation" a ON a."id" = cl."accommodationId"
    WHERE cl."createdAt" >= :1
      AND cl."createdAt" <= :2
      AND a."isActive" = 1
    GROUP BY
      a."id", a."platform", a."platformId", a."url", a."name",
      a."platformName", a."platformImage", a."platformDescription",
      a."addressCountry", a."addressRegion", a."addressLocality",
      a."ratingValue", a."reviewCount", a."latitude", a."longitude",
      a."lastPriceCurrency"`,
    [windowStartAt, windowEndAt],
  );
  const queryTimeMs = Date.now() - queryStart;

  if (rows.length === 0) {
    return { ...emptyResult, queryTimeMs };
  }

  // Step 2: In-memory grouping by platformPropertyKey
  const aggregationStart = Date.now();
  const aggregates = new Map<string, PropertyAggregate>();
  let skippedWithoutKey = 0;

  for (const row of rows) {
    const accommodation = toAccommodationSource(row);

    const platformPropertyKey = derivePlatformPropertyKey(accommodation);
    if (!platformPropertyKey) {
      skippedWithoutKey += 1;
      continue;
    }

    const identity = `${accommodation.platform}:${platformPropertyKey}`;
    const aggregate = aggregates.get(identity) ?? createAggregate(accommodation, platformPropertyKey, now);
    mergeMetadata(aggregate, accommodation);
    aggregate.lastObservedAt = now;

    aggregate.sampleSize += Number(row.sampleSize);
    aggregate.priceCount += Number(row.priceCount);
    aggregate.priceSum += Number(row.priceSum);
    aggregate.availableCount += Number(row.availableCount);
    aggregate.unavailableCount += Number(row.unavailableCount);
    aggregate.errorCount += Number(row.errorCount);

    if (typeof row.minPriceAmount === 'number') {
      aggregate.minPriceAmount =
        aggregate.minPriceAmount == null ? row.minPriceAmount : Math.min(aggregate.minPriceAmount, row.minPriceAmount);
    }
    if (typeof row.maxPriceAmount === 'number') {
      aggregate.maxPriceAmount =
        aggregate.maxPriceAmount == null ? row.maxPriceAmount : Math.max(aggregate.maxPriceAmount, row.maxPriceAmount);
    }

    aggregates.set(identity, aggregate);
  }
  const aggregationTimeMs = Date.now() - aggregationStart;

  // Step 3: Upsert PublicProperty + PublicAvailabilitySnapshot
  const upsertStart = Date.now();
  let upsertedProperties = 0;
  let upsertedSnapshots = 0;

  const validAggregates = [...aggregates.values()].filter((a) => a.sampleSize > 0);
  const batches = chunk(validAggregates, BATCH_SIZE);
  const propertyRepo = ds.getRepository(PublicProperty);
  const snapshotRepo = ds.getRepository(PublicAvailabilitySnapshot);

  for (const batch of batches) {
    // PublicProperty upsert
    const propertyIds: string[] = [];

    for (const agg of batch) {
      const existing = await propertyRepo.findOne({
        where: { platform: agg.platform, platformPropertyKey: agg.platformPropertyKey },
        select: { id: true },
      });

      if (existing) {
        await propertyRepo.update(
          { id: existing.id },
          {
            slug: agg.slug,
            name: agg.name,
            sourceUrl: agg.sourceUrl,
            imageUrl: agg.imageUrl,
            description: agg.description,
            countryKey: agg.countryKey,
            cityKey: agg.cityKey,
            addressRegion: agg.addressRegion,
            addressLocality: agg.addressLocality,
            ratingValue: agg.ratingValue,
            reviewCount: agg.reviewCount,
            latitude: agg.latitude,
            longitude: agg.longitude,
            lastObservedAt: agg.lastObservedAt,
            isActive: true,
          },
        );
        propertyIds.push(existing.id);
      } else {
        const entity = propertyRepo.create({
          platform: agg.platform,
          platformPropertyKey: agg.platformPropertyKey,
          slug: agg.slug,
          name: agg.name,
          sourceUrl: agg.sourceUrl,
          imageUrl: agg.imageUrl,
          description: agg.description,
          countryKey: agg.countryKey,
          cityKey: agg.cityKey,
          addressRegion: agg.addressRegion,
          addressLocality: agg.addressLocality,
          ratingValue: agg.ratingValue,
          reviewCount: agg.reviewCount,
          latitude: agg.latitude,
          longitude: agg.longitude,
          lastObservedAt: agg.lastObservedAt,
          isActive: true,
        });
        await propertyRepo.save(entity);
        propertyIds.push(entity.id);
      }
      upsertedProperties++;
    }

    // PublicAvailabilitySnapshot upsert
    for (let idx = 0; idx < batch.length; idx++) {
      const agg = batch[idx];
      const propertyId = propertyIds[idx];
      const avgPriceAmount = agg.priceCount > 0 ? Math.round(agg.priceSum / agg.priceCount) : null;
      const openRate = safeOpenRate(agg.availableCount, agg.sampleSize);

      const existingSnapshot = await snapshotRepo.findOne({
        where: { publicPropertyId: propertyId, snapshotDate },
        select: { id: true },
      });

      if (existingSnapshot) {
        await snapshotRepo.update(
          { id: existingSnapshot.id },
          {
            windowStartAt,
            windowEndAt,
            sampleSize: agg.sampleSize,
            availableCount: agg.availableCount,
            unavailableCount: agg.unavailableCount,
            errorCount: agg.errorCount,
            avgPriceAmount,
            minPriceAmount: agg.minPriceAmount,
            maxPriceAmount: agg.maxPriceAmount,
            currency: agg.currency,
            openRate,
          },
        );
      } else {
        const snapshotEntity = snapshotRepo.create({
          publicPropertyId: propertyId,
          snapshotDate,
          windowStartAt,
          windowEndAt,
          sampleSize: agg.sampleSize,
          availableCount: agg.availableCount,
          unavailableCount: agg.unavailableCount,
          errorCount: agg.errorCount,
          avgPriceAmount,
          minPriceAmount: agg.minPriceAmount,
          maxPriceAmount: agg.maxPriceAmount,
          currency: agg.currency,
          openRate,
        });
        await snapshotRepo.save(snapshotEntity);
      }
      upsertedSnapshots++;
    }
  }
  const upsertTimeMs = Date.now() - upsertStart;

  return {
    snapshotDate: snapshotDate.toISOString(),
    windowStartAt: windowStartAt.toISOString(),
    windowEndAt: windowEndAt.toISOString(),
    scannedAccommodations: rows.length,
    upsertedProperties,
    upsertedSnapshots,
    skippedWithoutKey,
    queryTimeMs,
    aggregationTimeMs,
    upsertTimeMs,
  };
}
