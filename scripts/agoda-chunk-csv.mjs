#!/usr/bin/env node
/**
 * Agoda 호텔 CSV 청킹 스크립트
 *
 * 사용법:
 *   node scripts/agoda-chunk-csv.mjs <입력파일> [옵션]
 *
 * 옵션:
 *   --chunk-size  청크당 행 수 (기본값: 100000)
 *   --out-dir     출력 디렉토리 (기본값: ~/Downloads/agoda-chunks)
 *
 * 예시:
 *   node scripts/agoda-chunk-csv.mjs ~/Downloads/56A3C1A2-0531-49F3-8720-D7D4B1410E41_KO.csv
 *   node scripts/agoda-chunk-csv.mjs ~/Downloads/56A3C1A2-0531-49F3-8720-D7D4B1410E41_KO.csv --chunk-size 50000 --out-dir ./data/agoda
 *
 * 주의: CSV 필드 내 개행 문자 처리를 위해 Python csv 모듈을 사용합니다.
 *       Python 3가 설치되어 있어야 합니다.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { resolve, join, basename, extname } from 'node:path';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';

// ============================================================================
// 인수 파싱
// ============================================================================

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
사용법: node scripts/agoda-chunk-csv.mjs <입력파일> [옵션]

옵션:
  --chunk-size <n>   청크당 행 수 (기본값: 100000)
  --out-dir <path>   출력 디렉토리 (기본값: ~/Downloads/agoda-chunks)
  `);
  process.exit(0);
}

function parseArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return defaultValue;
}

const inputPath = resolve(args[0].replace(/^~/, homedir()));
const chunkSize = parseInt(parseArg('--chunk-size', '100000'), 10);
const outDir = resolve(
  parseArg('--out-dir', join(homedir(), 'Downloads', 'agoda-chunks')).replace(/^~/, homedir()),
);

mkdirSync(outDir, { recursive: true });

// ============================================================================
// Python 스크립트 (CSV 필드 내 개행 올바르게 처리)
// ============================================================================

const baseName = basename(inputPath, extname(inputPath));

const pythonScript = `
import csv
import os
import sys
import time

input_path = ${JSON.stringify(inputPath)}
out_dir    = ${JSON.stringify(outDir)}
chunk_size = ${chunkSize}
base_name  = ${JSON.stringify(baseName)}

start = time.time()
chunk_index = 0
chunk_row   = 0
total_rows  = 0
header      = None
writer      = None
out_file    = None

def open_next_chunk():
    global writer, out_file, chunk_index
    path = os.path.join(out_dir, f"{base_name}_chunk_{chunk_index+1:03d}.csv")
    out_file = open(path, 'w', newline='', encoding='utf-8-sig')
    writer = csv.writer(out_file, quoting=csv.QUOTE_ALL)
    writer.writerow(header)
    print(f"  청크 {chunk_index+1:03d} 시작: {path}", flush=True)
    return path

with open(input_path, newline='', encoding='utf-8-sig') as f:
    reader = csv.reader(f)
    for row in reader:
        if header is None:
            header = row
            open_next_chunk()
            continue

        if chunk_row == chunk_size:
            out_file.close()
            chunk_index += 1
            chunk_row = 0
            open_next_chunk()

        writer.writerow(row)
        chunk_row  += 1
        total_rows += 1

        if total_rows % 100000 == 0:
            elapsed = time.time() - start
            print(f"  진행: {total_rows:,}행 처리됨 ({elapsed:.1f}s)", flush=True)

if out_file:
    out_file.close()

elapsed = time.time() - start
print(f"\\n완료")
print(f"  총 행 수  : {total_rows:,}행")
print(f"  생성 청크 : {chunk_index + 1}개")
print(f"  소요 시간 : {elapsed:.1f}초")
print(f"  출력 위치 : {out_dir}")
`;

// Python 스크립트를 임시 파일로 저장 후 실행
const tmpScript = join(tmpdir(), 'agoda_chunk.py');
writeFileSync(tmpScript, pythonScript, 'utf8');

console.log(`\n📂 출력 디렉토리: ${outDir}`);
console.log(`📄 청크 크기: ${chunkSize.toLocaleString()}행`);
console.log(`📥 입력 파일: ${inputPath}\n`);

const result = spawnSync('python3', [tmpScript], { stdio: 'inherit' });

try { unlinkSync(tmpScript); } catch {}

if (result.status !== 0) {
  console.error('❌ 오류 발생');
  process.exit(1);
}
