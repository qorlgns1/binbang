#!/usr/bin/env tsx

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getDataSource, getQualifiedAgodaHotelsSearchTable } from '../packages/db/src/index.js';

type MissingPair = {
  cityNameKo: string;
  countryCode: string;
  countryNameKo: string | null;
  rowCount: number;
};

type CountryMapping = {
  countryCode: string;
  countryNameEn: string;
};

type GeocodedPair = {
  cityNameKo: string;
  countryCode: string;
  cityNameEn: string;
  countryNameEn: string | null;
};

const args = process.argv.slice(2);
const batchSize = Number.parseInt(parseArg('--batch', '200'), 10);
const concurrency = Number.parseInt(parseArg('--concurrency', '12'), 10);
const SEARCH_TABLE = getQualifiedAgodaHotelsSearchTable();

function parseArg(flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return defaultValue;
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

async function queryRows<T>(sql: string, params: unknown[] = []): Promise<T> {
  const ds = await getDataSource();
  return ds.query<T>(sql, params);
}

async function queryCount(sql: string, params: unknown[] = []): Promise<number> {
  const rows = await queryRows<Array<{ count: unknown }>>(sql, params);
  return parseNumber(rows[0]?.count);
}

function readEnvValue(filePath: string, key: string): string | null {
  if (!existsSync(filePath)) return null;
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const envKey = trimmed.slice(0, eqIndex).trim();
    if (envKey !== key) continue;
    return trimmed
      .slice(eqIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }
  return null;
}

function loadGoogleMapsApiKey(): string | null {
  if (process.env.GOOGLE_MAPS_API_KEY?.trim()) return process.env.GOOGLE_MAPS_API_KEY.trim();

  const candidates = [
    resolve('.env.local'),
    resolve('apps/travel/.env.local'),
    resolve('.env'),
    resolve('apps/travel/.env'),
  ];

  for (const filePath of candidates) {
    const value = readEnvValue(filePath, 'GOOGLE_MAPS_API_KEY');
    if (value) return value;
  }

  return null;
}

function getDisplayNameForCountryCode(countryCode: string): string | null {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(countryCode) ?? null;
  } catch {
    return null;
  }
}

async function countMissing(): Promise<{ city: number; country: number }> {
  const [city, country] = await Promise.all([
    queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE} WHERE "cityNameEn" IS NULL`),
    queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE} WHERE "countryNameEn" IS NULL`),
  ]);

  return { city, country };
}

async function backfillCountryNames(): Promise<number> {
  const before = await queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE} WHERE "countryNameEn" IS NULL`);
  const missingCodes = await queryRows<Array<{ countryCode: string | null }>>(
    `SELECT DISTINCT "countryCode" AS "countryCode"
       FROM ${SEARCH_TABLE}
      WHERE "countryNameEn" IS NULL
        AND "countryCode" IS NOT NULL`,
  );

  const mappings: CountryMapping[] = missingCodes
    .map((row) => row.countryCode)
    .filter((code): code is string => Boolean(code))
    .map((countryCode) => ({
      countryCode,
      countryNameEn: getDisplayNameForCountryCode(countryCode) ?? '',
    }))
    .filter((row) => row.countryNameEn.length > 0);

  if (mappings.length === 0) return 0;

  await queryRows(
    `
    MERGE INTO ${SEARCH_TABLE} target
    USING (
      SELECT
        countryCode,
        countryNameEn
      FROM JSON_TABLE(
        :1,
        '$[*]'
        COLUMNS (
          countryCode VARCHAR2(10) PATH '$.countryCode',
          countryNameEn VARCHAR2(200) PATH '$.countryNameEn'
        )
      )
    ) input
      ON (target."countryCode" = input.countryCode)
    WHEN MATCHED THEN
      UPDATE SET
        target."countryNameEn" = input.countryNameEn,
        target."updatedAt" = SYSTIMESTAMP
      WHERE target."countryNameEn" IS NULL
    `,
    [JSON.stringify(mappings)],
  );

  const after = await queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE} WHERE "countryNameEn" IS NULL`);
  return Math.max(0, before - after);
}

async function propagateCityNamesByCityId(): Promise<number> {
  const before = await queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE} WHERE "cityNameEn" IS NULL`);

  await queryRows(`
    MERGE INTO ${SEARCH_TABLE} target
    USING (
      SELECT
        "cityId",
        "cityNameEn"
      FROM (
        SELECT
          "cityId",
          "cityNameEn",
          ROW_NUMBER() OVER (
            PARTITION BY "cityId"
            ORDER BY COUNT(*) DESC, "cityNameEn" ASC
          ) AS rn
        FROM ${SEARCH_TABLE}
        WHERE "cityNameEn" IS NOT NULL
        GROUP BY "cityId", "cityNameEn"
      )
      WHERE rn = 1
    ) ranked
      ON (target."cityId" = ranked."cityId")
    WHEN MATCHED THEN
      UPDATE SET
        target."cityNameEn" = ranked."cityNameEn",
        target."updatedAt" = SYSTIMESTAMP
      WHERE target."cityNameEn" IS NULL
  `);

  const after = await queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE} WHERE "cityNameEn" IS NULL`);
  return Math.max(0, before - after);
}

async function propagateCityNamesByPair(): Promise<number> {
  const before = await queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE} WHERE "cityNameEn" IS NULL`);

  await queryRows(`
    MERGE INTO ${SEARCH_TABLE} target
    USING (
      SELECT
        "cityNameKo",
        "countryCode",
        "cityNameEn"
      FROM (
        SELECT
          "cityNameKo",
          "countryCode",
          "cityNameEn",
          ROW_NUMBER() OVER (
            PARTITION BY "cityNameKo", "countryCode"
            ORDER BY COUNT(*) DESC, "cityNameEn" ASC
          ) AS rn
        FROM ${SEARCH_TABLE}
        WHERE "cityNameEn" IS NOT NULL
          AND "cityNameKo" IS NOT NULL
          AND "countryCode" IS NOT NULL
        GROUP BY "cityNameKo", "countryCode", "cityNameEn"
      )
      WHERE rn = 1
    ) ranked
      ON (
        target."cityNameKo" = ranked."cityNameKo"
        AND target."countryCode" = ranked."countryCode"
      )
    WHEN MATCHED THEN
      UPDATE SET
        target."cityNameEn" = ranked."cityNameEn",
        target."updatedAt" = SYSTIMESTAMP
      WHERE target."cityNameEn" IS NULL
  `);

  const after = await queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE} WHERE "cityNameEn" IS NULL`);
  return Math.max(0, before - after);
}

async function getRemainingPairs(): Promise<MissingPair[]> {
  const rows = await queryRows<Array<MissingPair & { rowCount: unknown }>>(
    `SELECT
       "cityNameKo" AS "cityNameKo",
       "countryCode" AS "countryCode",
       "countryNameKo" AS "countryNameKo",
       COUNT(*) AS "rowCount"
     FROM ${SEARCH_TABLE}
     WHERE "cityNameEn" IS NULL
       AND "cityNameKo" IS NOT NULL
       AND "countryCode" IS NOT NULL
     GROUP BY "cityNameKo", "countryCode", "countryNameKo"
     ORDER BY COUNT(*) DESC, "cityNameKo" ASC`,
  );

  return rows.map((row) => ({
    cityNameKo: row.cityNameKo,
    countryCode: row.countryCode,
    countryNameKo: row.countryNameKo,
    rowCount: parseNumber(row.rowCount),
  }));
}

function extractGeocodedCity(result: Record<string, unknown>): string | null {
  const components = Array.isArray(result.address_components) ? result.address_components : [];
  const priorities = [
    'locality',
    'postal_town',
    'administrative_area_level_3',
    'administrative_area_level_2',
    'sublocality_level_1',
    'administrative_area_level_1',
  ];

  for (const priority of priorities) {
    for (const component of components) {
      if (
        component &&
        typeof component === 'object' &&
        Array.isArray((component as { types?: unknown }).types) &&
        (component as { types: string[] }).types.includes(priority)
      ) {
        const name = (component as { long_name?: unknown }).long_name;
        if (typeof name === 'string' && name.trim()) return name.trim();
      }
    }
  }

  const firstComponent = components[0];
  if (firstComponent && typeof firstComponent === 'object') {
    const name = (firstComponent as { long_name?: unknown }).long_name;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }

  const formatted = result.formatted_address;
  if (typeof formatted === 'string' && formatted.trim()) {
    const [firstSegment] = formatted.split(',');
    if (firstSegment?.trim()) return firstSegment.trim();
  }

  return null;
}

function extractGeocodedCountry(result: Record<string, unknown>): string | null {
  const components = Array.isArray(result.address_components) ? result.address_components : [];
  for (const component of components) {
    if (
      component &&
      typeof component === 'object' &&
      Array.isArray((component as { types?: unknown }).types) &&
      (component as { types: string[] }).types.includes('country')
    ) {
      const name = (component as { long_name?: unknown }).long_name;
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
  }
  return null;
}

async function geocodePair(pair: MissingPair, apiKey: string): Promise<GeocodedPair | null> {
  async function requestGeocode(
    params: URLSearchParams,
    attempt = 0,
  ): Promise<{
    status?: string;
    results?: Array<Record<string, unknown>>;
  }> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;
    const response = await fetch(url);
    const data = (await response.json()) as { status?: string; results?: Array<Record<string, unknown>> };

    if (data.status === 'OVER_QUERY_LIMIT' && attempt < 5) {
      const delayMs = 500 * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return requestGeocode(params, attempt + 1);
    }

    return data;
  }

  function buildCandidate(data: { results?: Array<Record<string, unknown>> } | null): GeocodedPair | null {
    const result = data?.results?.[0];
    if (!result) return null;

    const countryNameEn = extractGeocodedCountry(result);
    const cityNameEn = extractGeocodedCity(result);
    if (!cityNameEn) return null;
    if (countryNameEn && cityNameEn === countryNameEn) return null;

    return {
      cityNameKo: pair.cityNameKo,
      countryCode: pair.countryCode,
      cityNameEn,
      countryNameEn,
    };
  }

  const attempts = [
    new URLSearchParams({
      address: pair.cityNameKo,
      components: `country:${pair.countryCode}`,
      language: 'en',
      key: apiKey,
    }),
    pair.countryNameKo
      ? new URLSearchParams({
          address: `${pair.cityNameKo}, ${pair.countryNameKo}`,
          language: 'en',
          key: apiKey,
        })
      : null,
    new URLSearchParams({
      address: pair.cityNameKo,
      language: 'en',
      key: apiKey,
    }),
  ].filter((params): params is URLSearchParams => params != null);

  for (const params of attempts) {
    const data = await requestGeocode(params);
    const candidate = buildCandidate(data);
    if (candidate) return candidate;
  }

  return null;
}

async function updateGeocodedBatch(rows: GeocodedPair[]): Promise<number> {
  if (rows.length === 0) return 0;

  await queryRows(
    `
    MERGE INTO ${SEARCH_TABLE} target
    USING (
      SELECT
        cityNameKo,
        countryCode,
        cityNameEn,
        countryNameEn
      FROM JSON_TABLE(
        :1,
        '$[*]'
        COLUMNS (
          cityNameKo VARCHAR2(200) PATH '$.cityNameKo',
          countryCode VARCHAR2(10) PATH '$.countryCode',
          cityNameEn VARCHAR2(200) PATH '$.cityNameEn',
          countryNameEn VARCHAR2(200) PATH '$.countryNameEn'
        )
      )
    ) input
      ON (
        target."cityNameKo" = input.cityNameKo
        AND target."countryCode" = input.countryCode
      )
    WHEN MATCHED THEN
      UPDATE SET
        target."cityNameEn" = COALESCE(input.cityNameEn, target."cityNameEn"),
        target."countryNameEn" = COALESCE(target."countryNameEn", input.countryNameEn),
        target."updatedAt" = SYSTIMESTAMP
      WHERE target."cityNameEn" IS NULL
    `,
    [JSON.stringify(rows)],
  );

  return rows.length;
}

async function refreshSearchTextEn(): Promise<number> {
  await queryRows(`
    UPDATE ${SEARCH_TABLE}
    SET
      "searchTextEn" = TRIM(REGEXP_REPLACE(
        COALESCE("hotelNameEn", '') || ' ' ||
        COALESCE("hotelNameKo", '') || ' ' ||
        COALESCE("cityNameEn", '') || ' ' ||
        COALESCE("countryNameEn", '') || ' ' ||
        COALESCE("countryCode", ''),
        '[[:space:]]+',
        ' '
      )),
      "updatedAt" = SYSTIMESTAMP
  `);

  return queryCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE}`);
}

async function geocodeRemainingPairs(apiKey: string): Promise<{ resolvedPairs: number; updatedRows: number }> {
  const remainingPairs = await getRemainingPairs();
  if (remainingPairs.length === 0) return { resolvedPairs: 0, updatedRows: 0 };

  console.log(`지오코딩 대상 pair: ${remainingPairs.length.toLocaleString()}개`);

  const resolved: GeocodedPair[] = [];
  let updatedRows = 0;
  let completed = 0;
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < remainingPairs.length) {
      const current = remainingPairs[cursor];
      cursor += 1;

      try {
        const geocoded = await geocodePair(current, apiKey);
        if (geocoded) {
          resolved.push(geocoded);
          if (resolved.length >= batchSize) {
            const batch = resolved.splice(0, resolved.length);
            updatedRows += await updateGeocodedBatch(batch);
          }
        }
      } catch (error) {
        console.warn(
          `[agoda-backfill-search-en] geocode failed city=${current.cityNameKo} countryCode=${current.countryCode}:`,
          error,
        );
      } finally {
        completed += 1;
        if (completed % 250 === 0 || completed === remainingPairs.length) {
          console.log(
            `[geocode] ${completed.toLocaleString()}/${remainingPairs.length.toLocaleString()} pairs processed`,
          );
        }
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);

  if (resolved.length > 0) {
    updatedRows += await updateGeocodedBatch(resolved.splice(0, resolved.length));
  }

  return { resolvedPairs: completed, updatedRows };
}

async function translateCityName(cityNameKo: string): Promise<string | null> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'ko',
    tl: 'en',
    dt: 't',
    q: cityNameKo,
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
    if (!response.ok) {
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      continue;
    }

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;

    const translated = (data[0] as Array<unknown>)
      .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
      .join('')
      .trim();

    if (!translated) return null;
    return translated;
  }

  return null;
}

async function translateRemainingPairs(): Promise<{ resolvedPairs: number; updatedRows: number }> {
  const remainingPairs = await getRemainingPairs();
  if (remainingPairs.length === 0) return { resolvedPairs: 0, updatedRows: 0 };

  console.log(`번역 대상 pair: ${remainingPairs.length.toLocaleString()}개`);

  const resolved: GeocodedPair[] = [];
  let updatedRows = 0;
  let completed = 0;
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < remainingPairs.length) {
      const current = remainingPairs[cursor];
      cursor += 1;

      try {
        const translated = await translateCityName(current.cityNameKo);
        if (translated) {
          resolved.push({
            cityNameKo: current.cityNameKo,
            countryCode: current.countryCode,
            cityNameEn: translated,
            countryNameEn: null,
          });
          if (resolved.length >= batchSize) {
            const batch = resolved.splice(0, resolved.length);
            updatedRows += await updateGeocodedBatch(batch);
          }
        }
      } catch (error) {
        console.warn(
          `[agoda-backfill-search-en] translate failed city=${current.cityNameKo} countryCode=${current.countryCode}:`,
          error,
        );
      } finally {
        completed += 1;
        if (completed % 250 === 0 || completed === remainingPairs.length) {
          console.log(
            `[translate] ${completed.toLocaleString()}/${remainingPairs.length.toLocaleString()} pairs processed`,
          );
        }
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);

  if (resolved.length > 0) {
    updatedRows += await updateGeocodedBatch(resolved.splice(0, resolved.length));
  }

  return { resolvedPairs: completed, updatedRows };
}

async function main() {
  const before = await countMissing();
  console.log(
    `시작: missing cityNameEn=${before.city.toLocaleString()}, missing countryNameEn=${before.country.toLocaleString()}`,
  );
  console.log(`target table: ${SEARCH_TABLE}`);

  const countryUpdated = await backfillCountryNames();
  console.log(`countryNameEn backfill: ${countryUpdated.toLocaleString()}행`);

  const cityByIdUpdated = await propagateCityNamesByCityId();
  console.log(`cityNameEn by cityId: ${cityByIdUpdated.toLocaleString()}행`);

  const cityByPairUpdated = await propagateCityNamesByPair();
  console.log(`cityNameEn by (cityNameKo,countryCode): ${cityByPairUpdated.toLocaleString()}행`);

  const apiKey = loadGoogleMapsApiKey();
  let geocodeSummary = { resolvedPairs: 0, updatedRows: 0 };

  if (apiKey) {
    geocodeSummary = await geocodeRemainingPairs(apiKey);
    console.log(
      `geocode backfill: ${geocodeSummary.updatedRows.toLocaleString()}행 (pairs processed=${geocodeSummary.resolvedPairs.toLocaleString()})`,
    );
  } else {
    console.warn('GOOGLE_MAPS_API_KEY가 없어 남은 cityNameEn 지오코딩은 건너뜁니다.');
  }

  const translateSummary = await translateRemainingPairs();
  console.log(
    `translate backfill: ${translateSummary.updatedRows.toLocaleString()}행 (pairs processed=${translateSummary.resolvedPairs.toLocaleString()})`,
  );

  const refreshed = await refreshSearchTextEn();
  console.log(`searchTextEn refresh: ${refreshed.toLocaleString()}행`);

  const after = await countMissing();
  console.log(`
✅ agoda_hotels_search EN backfill 완료
   before city   : ${before.city.toLocaleString()}
   after city    : ${after.city.toLocaleString()}
   before country: ${before.country.toLocaleString()}
   after country : ${after.country.toLocaleString()}
  `);
}

main().catch((error) => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
