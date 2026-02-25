#!/usr/bin/env tsx
/**
 * Agoda 호텔 CSV 청크 → DB import 스크립트
 *
 * 실행:
 *   pnpm tsx scripts/agoda-import-csv.ts
 *   pnpm tsx scripts/agoda-import-csv.ts --dir ~/Downloads/agoda-chunks
 *   pnpm tsx scripts/agoda-import-csv.ts --dir ~/Downloads/agoda-chunks --batch 1000
 *
 * 동작 방식:
 *   Python subprocess로 CSV 파싱(필드 내 개행 처리) → JSON Lines stdout
 *   Node.js readline으로 수신 → BATCH_SIZE 행마다 Prisma createMany (스트리밍, 메모리 절약)
 */

import { createInterface } from 'node:readline';
import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { prisma } from '../packages/db/src/index';

// ============================================================================
// 인수 파싱
// ============================================================================

const args = process.argv.slice(2);

function parseArg(flag: string, defaultValue: string): string {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return defaultValue;
}

const chunkDir = resolve(parseArg('--dir', join(homedir(), 'Downloads', 'agoda-chunks')).replace(/^~/, homedir()));
const BATCH_SIZE = parseInt(parseArg('--batch', '1000'), 10);

// ============================================================================
// Python CSV 파서 (JSON Lines 출력)
// ============================================================================

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
                'hotelId':             hotel_id,
                'hotelName':           hotel_name,
                'hotelTranslatedName': row.get('hotel_translated_name', '').strip() or None,
                'cityId':              int(row['city_id']) if row.get('city_id') else None,
                'cityName':            row.get('city', '').strip() or None,
                'countryName':         row.get('country', '').strip() or None,
                'countryCode':         row.get('countryisocode', '').strip() or None,
                'starRating':          float(row['star_rating']) if row.get('star_rating') else None,
                'ratingAverage':       float(row['rating_average']) if row.get('rating_average') else None,
                'reviewCount':         int(row['number_of_reviews']) if row.get('number_of_reviews') else None,
                'latitude':            float(row['latitude']) if row.get('latitude') else None,
                'longitude':           float(row['longitude']) if row.get('longitude') else None,
                'photoUrl':            row.get('photo1', '').strip() or None,
                'url':                 row.get('url', '').strip() or None,
            }
            print(json.dumps(obj, ensure_ascii=False), flush=True)
            count += 1
        except Exception as e:
            skipped += 1

print(json.dumps({'__meta__': True, 'count': count, 'skipped': skipped}), flush=True)
`;

// ============================================================================
// 타입
// ============================================================================

type HotelRow = {
  hotelId: number;
  hotelName: string;
  hotelTranslatedName: string | null;
  cityId: number | null;
  cityName: string | null;
  countryName: string | null;
  countryCode: string | null;
  starRating: number | null;
  ratingAverage: number | null;
  reviewCount: number | null;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  url: string | null;
};

type ChunkSummary = { parsed: number; skipped: number; inserted: number };

// ============================================================================
// 스트리밍 파싱 + 배치 insert (메모리 절약)
// ============================================================================

function processChunk(
  filePath: string,
  batchSize: number,
  onBatch: (rows: HotelRow[]) => Promise<number>,
): Promise<ChunkSummary> {
  return new Promise((resolvePromise, rejectPromise) => {
    const py = spawn('python3', ['-c', PYTHON_PARSER, filePath]);
    const rl = createInterface({ input: py.stdout, crlfDelay: Infinity });

    let buffer: HotelRow[] = [];
    let meta = { parsed: 0, skipped: 0 };
    let inserted = 0;
    const errors: string[] = [];
    let rlClosed = false;

    // 직렬 배치 처리 체인 (rl.pause/resume으로 백프레셔 구현)
    let chain: Promise<void> = Promise.resolve();

    const flushBuffer = () => {
      const batch = buffer;
      buffer = [];
      if (!rlClosed) rl.pause();
      chain = chain
        .then(() => onBatch(batch))
        .then((count) => {
          inserted += count;
          if (!rlClosed) rl.resume();
        })
        .catch((err) => rejectPromise(err));
    };

    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const obj = JSON.parse(line) as Record<string, unknown>;
        if (obj.__meta__) {
          meta = { parsed: obj.count as number, skipped: obj.skipped as number };
          return;
        }
        buffer.push(obj as unknown as HotelRow);
        if (buffer.length >= batchSize) {
          flushBuffer();
        }
      } catch {
        // JSON 파싱 실패 라인 무시
      }
    });

    rl.on('close', () => {
      rlClosed = true;
      // 남은 버퍼 플러시
      if (buffer.length > 0) {
        flushBuffer();
      }
    });

    py.stderr.on('data', (data: Buffer) => errors.push(data.toString()));

    py.on('close', (code) => {
      // Python 종료 후 체인이 완전히 끝나면 resolve
      chain.then(() => {
        if (code !== 0) {
          rejectPromise(new Error(`Python 오류 (exit ${code}): ${errors.join('')}`));
        } else {
          resolvePromise({ ...meta, inserted });
        }
      });
    });
  });
}

// ============================================================================
// Prisma 배치 upsert
// ============================================================================

async function importBatch(rows: HotelRow[]): Promise<number> {
  const result = await prisma.agodaHotel.createMany({
    data: rows,
    skipDuplicates: true,
  });
  return result.count;
}

// ============================================================================
// 메인
// ============================================================================

async function main() {
  const files = readdirSync(chunkDir)
    .filter((f) => f.endsWith('.csv'))
    .sort()
    .map((f) => join(chunkDir, f));

  if (files.length === 0) {
    console.error(`❌ CSV 파일 없음: ${chunkDir}`);
    process.exit(1);
  }

  console.log(`\n📂 디렉토리  : ${chunkDir}`);
  console.log(`📄 청크 수   : ${files.length}개`);
  console.log(`📦 배치 크기 : ${BATCH_SIZE.toLocaleString()}행\n`);

  const globalStart = Date.now();
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalParsed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const label = `[${String(i + 1).padStart(3, '0')}/${files.length}]`;
    const chunkStart = Date.now();

    process.stdout.write(`${label} 처리 중... `);

    const { parsed, skipped, inserted } = await processChunk(file, BATCH_SIZE, importBatch);

    totalParsed += parsed;
    totalSkipped += skipped;
    totalInserted += inserted;

    const elapsed = ((Date.now() - chunkStart) / 1000).toFixed(1);
    console.log(`${parsed.toLocaleString()}행 파싱 → ${inserted.toLocaleString()}행 insert (${elapsed}s)`);
  }

  const totalElapsed = ((Date.now() - globalStart) / 1000).toFixed(1);

  console.log(`
✅ 완료
   총 파싱   : ${totalParsed.toLocaleString()}행
   총 insert : ${totalInserted.toLocaleString()}행
   스킵      : ${totalSkipped.toLocaleString()}행 (중복 포함)
   소요 시간 : ${totalElapsed}초
  `);
}

main()
  .catch((err) => {
    console.error('❌ 오류:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
