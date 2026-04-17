#!/usr/bin/env tsx

import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

import {
  getDataSource,
  getQualifiedAgodaHotelsSearchTable,
  getQualifiedAgodaHotelsTable,
} from '../packages/db/src/index.js';

type EnHotelRow = {
  hotelId: number;
  hotelNameEn: string;
  cityNameEn: string | null;
  countryNameEn: string | null;
};

type ChunkSummary = {
  parsed: number;
  skipped: number;
  updated: number;
};

const args = process.argv.slice(2);
const SEARCH_TABLE = getQualifiedAgodaHotelsSearchTable();
const HOTELS_TABLE = getQualifiedAgodaHotelsTable();

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

const enChunkDir = resolve(
  parseArg('--en-dir', join(homedir(), 'Downloads', 'agoda-hotels-info-chunks-en')).replace(/^~/, homedir()),
);
const batchSize = Number.parseInt(parseArg('--batch', '1000'), 10);

const PYTHON_PARSER = `
import csv, json, sys

file_path = sys.argv[1]
count = 0
skipped = 0

with open(file_path, newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            hotel_id = int(row['hotel_id']) if row.get('hotel_id') else None
            hotel_name = row.get('hotel_name', '').strip() or None
            if not hotel_id or not hotel_name:
                skipped += 1
                continue

            obj = {
                'hotelId': hotel_id,
                'hotelNameEn': hotel_name,
                'cityNameEn': row.get('city', '').strip() or None,
                'countryNameEn': row.get('country', '').strip() or None,
            }
            print(json.dumps(obj, ensure_ascii=False), flush=True)
            count += 1
        except Exception:
            skipped += 1

print(json.dumps({'__meta__': True, 'count': count, 'skipped': skipped}), flush=True)
`;

async function fetchCount(sql: string, params: unknown[] = []): Promise<number> {
  const ds = await getDataSource();
  const rows = await ds.query<Array<{ count: unknown }>>(sql, params);
  return parseNumber(rows[0]?.count);
}

async function rebuildKoBase(): Promise<number> {
  const ds = await getDataSource();

  await ds.query(`TRUNCATE TABLE ${SEARCH_TABLE}`);

  await ds.query(`
    INSERT INTO ${SEARCH_TABLE} (
      "hotelId",
      "cityId",
      "countryCode",
      "hotelNameKo",
      "hotelNameEn",
      "cityNameKo",
      "cityNameEn",
      "countryNameKo",
      "countryNameEn",
      "starRating",
      "ratingAverage",
      "reviewCount",
      "latitude",
      "longitude",
      "photoUrl",
      "url",
      "searchTextKo",
      "searchTextEn",
      "koSourcePresent",
      "enSourcePresent",
      "llmAliasFilled",
      "mergedAt",
      "updatedAt"
    )
    SELECT
      "hotelId",
      "cityId",
      "countryCode",
      COALESCE("hotelTranslatedName", "hotelName"),
      "hotelName",
      "cityName",
      NULL,
      "countryName",
      NULL,
      "starRating",
      "ratingAverage",
      "reviewCount",
      "latitude",
      "longitude",
      "photoUrl",
      "url",
      TRIM(REGEXP_REPLACE(
        COALESCE("hotelTranslatedName", "hotelName", '') || ' ' ||
        COALESCE("hotelName", '') || ' ' ||
        COALESCE("cityName", '') || ' ' ||
        COALESCE("countryName", '') || ' ' ||
        COALESCE("countryCode", ''),
        '[[:space:]]+',
        ' '
      )),
      TRIM(REGEXP_REPLACE(
        COALESCE("hotelName", '') || ' ' ||
        COALESCE("hotelTranslatedName", "hotelName", '') || ' ' ||
        COALESCE("countryCode", ''),
        '[[:space:]]+',
        ' '
      )),
      1,
      0,
      0,
      SYSTIMESTAMP,
      SYSTIMESTAMP
    FROM ${HOTELS_TABLE}
  `);

  return fetchCount(`SELECT COUNT(*) AS "count" FROM ${SEARCH_TABLE}`);
}

async function updateEnBatch(rows: EnHotelRow[]): Promise<number> {
  if (rows.length === 0) return 0;

  const ds = await getDataSource();
  const payload = JSON.stringify(rows);

  await ds.query(
    `
    MERGE INTO ${SEARCH_TABLE} target
    USING (
      SELECT
        hotelId,
        hotelNameEn,
        cityNameEn,
        countryNameEn
      FROM JSON_TABLE(
        :1,
        '$[*]'
        COLUMNS (
          hotelId NUMBER PATH '$.hotelId',
          hotelNameEn VARCHAR2(500) PATH '$.hotelNameEn',
          cityNameEn VARCHAR2(200) PATH '$.cityNameEn',
          countryNameEn VARCHAR2(200) PATH '$.countryNameEn'
        )
      )
    ) input
      ON (target."hotelId" = input.hotelId)
    WHEN MATCHED THEN
      UPDATE SET
        target."hotelNameEn" = COALESCE(input.hotelNameEn, target."hotelNameEn"),
        target."cityNameEn" = COALESCE(input.cityNameEn, target."cityNameEn"),
        target."countryNameEn" = COALESCE(input.countryNameEn, target."countryNameEn"),
        target."enSourcePresent" = 1,
        target."searchTextEn" = TRIM(REGEXP_REPLACE(
          COALESCE(input.hotelNameEn, target."hotelNameEn", '') || ' ' ||
          COALESCE(target."hotelNameKo", '') || ' ' ||
          COALESCE(input.cityNameEn, target."cityNameEn", '') || ' ' ||
          COALESCE(input.countryNameEn, target."countryNameEn", '') || ' ' ||
          COALESCE(target."countryCode", ''),
          '[[:space:]]+',
          ' '
        )),
        target."mergedAt" = SYSTIMESTAMP,
        target."updatedAt" = SYSTIMESTAMP
    `,
    [payload],
  );

  return rows.length;
}

function processChunk(filePath: string, onBatch: (rows: EnHotelRow[]) => Promise<number>): Promise<ChunkSummary> {
  return new Promise((resolvePromise, rejectPromise) => {
    const py = spawn('python3', ['-c', PYTHON_PARSER, filePath]);
    const rl = createInterface({ input: py.stdout, crlfDelay: Infinity });

    let buffer: EnHotelRow[] = [];
    let meta = { parsed: 0, skipped: 0 };
    let updated = 0;
    const errors: string[] = [];
    let rlClosed = false;

    let chain: Promise<void> = Promise.resolve();

    const flushBuffer = () => {
      const batch = buffer;
      buffer = [];
      if (!rlClosed) rl.pause();
      chain = chain
        .then(() => onBatch(batch))
        .then((count) => {
          updated += count;
          if (!rlClosed) rl.resume();
        })
        .catch((err) => rejectPromise(err));
    };

    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const obj = JSON.parse(line) as Record<string, unknown>;
        if (obj.__meta__) {
          meta = { parsed: parseNumber(obj.count), skipped: parseNumber(obj.skipped) };
          return;
        }
        buffer.push(obj as unknown as EnHotelRow);
        if (buffer.length >= batchSize) flushBuffer();
      } catch {
        // Ignore malformed JSON lines from parser.
      }
    });

    rl.on('close', () => {
      rlClosed = true;
      if (buffer.length > 0) flushBuffer();
    });

    py.stderr.on('data', (data: Buffer) => {
      errors.push(data.toString());
    });

    py.on('close', (code) => {
      chain.then(() => {
        if (code !== 0) {
          rejectPromise(new Error(`Python 오류 (exit ${code}): ${errors.join('')}`));
        } else {
          resolvePromise({ ...meta, updated });
        }
      });
    });
  });
}

async function mergeEnChunks(): Promise<{ parsed: number; skipped: number; updated: number }> {
  const files = readdirSync(enChunkDir)
    .filter((file) => file.endsWith('.csv'))
    .sort()
    .map((file) => join(enChunkDir, file));

  if (files.length === 0) {
    throw new Error(`EN CSV 파일이 없습니다: ${enChunkDir}`);
  }

  let totalParsed = 0;
  let totalSkipped = 0;
  let totalUpdated = 0;

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const label = `[EN ${String(index + 1).padStart(2, '0')}/${files.length}]`;
    const start = Date.now();
    process.stdout.write(`${label} 처리 중... `);

    const summary = await processChunk(file, updateEnBatch);
    totalParsed += summary.parsed;
    totalSkipped += summary.skipped;
    totalUpdated += summary.updated;

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `${summary.parsed.toLocaleString()}행 파싱 → ${summary.updated.toLocaleString()}행 업데이트 (${elapsed}s)`,
    );
  }

  return { parsed: totalParsed, skipped: totalSkipped, updated: totalUpdated };
}

async function main() {
  const globalStart = Date.now();

  console.log(`공용 Agoda 검색 테이블 재생성 시작`);
  console.log(`source table : ${HOTELS_TABLE}`);
  console.log(`target table : ${SEARCH_TABLE}`);

  const koInserted = await rebuildKoBase();
  console.log(`KO 베이스 적재 완료: ${koInserted.toLocaleString()}행`);

  console.log(`\nEN 병합 시작`);
  console.log(`EN 디렉토리 : ${enChunkDir}`);
  console.log(`배치 크기   : ${batchSize.toLocaleString()}행\n`);

  const enSummary = await mergeEnChunks();
  const totalElapsed = ((Date.now() - globalStart) / 1000).toFixed(1);

  console.log(`
✅ agoda_hotels_search 빌드 완료
   KO insert : ${koInserted.toLocaleString()}행
   EN parsed : ${enSummary.parsed.toLocaleString()}행
   EN update : ${enSummary.updated.toLocaleString()}행
   EN skip   : ${enSummary.skipped.toLocaleString()}행
   소요 시간 : ${totalElapsed}초
  `);
}

main().catch((error) => {
  console.error('❌ 오류:', error);
  process.exit(1);
});
