#!/usr/bin/env node
/**
 * i18n 정합성 검사 스크립트 (WU-10)
 *
 * 검사 항목:
 * 1. Key parity: 모든 locale에 동일한 key set이 존재하는지
 * 2. Param parity: {param} 패턴이 모든 locale에서 일치하는지
 * 3. 빈 값 검사: 번역 값이 비어있지 않은지
 *
 * 실패 시 locale/namespace/key를 명확히 출력한다.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');

/** 메시지 디렉터리 목록 (package → messages 경로) */
const MESSAGE_DIRS = [
  { pkg: 'apps/web', dir: join(ROOT, 'apps/web/messages') },
  { pkg: 'packages/worker-shared', dir: join(ROOT, 'packages/worker-shared/messages') },
];

/** JSON 객체를 flat key 목록으로 변환 (dot-separated) */
function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/** flat key에 해당하는 값을 가져온다 */
function getNestedValue(obj, key) {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/** 문자열에서 {param} 패턴을 추출한다 */
function extractParams(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{(\w+)\}/g);
  return matches ? matches.sort() : [];
}

let totalErrors = 0;

function reportError(pkg, namespace, locale, key, message) {
  totalErrors += 1;
  console.error(`  ERROR [${pkg}] ${namespace}/${locale} → key "${key}": ${message}`);
}

// ── Main ──

for (const { pkg, dir } of MESSAGE_DIRS) {
  if (!existsSync(dir)) {
    console.log(`SKIP ${pkg}: messages directory not found`);
    continue;
  }

  const locales = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  if (locales.length < 2) {
    console.log(`SKIP ${pkg}: only ${locales.length} locale(s) found`);
    continue;
  }

  console.log(`\nChecking ${pkg} (locales: ${locales.join(', ')})`);

  // 각 locale의 namespace 목록 수집
  const baseLocale = locales[0];
  const baseDir = join(dir, baseLocale);
  const namespaces = readdirSync(baseDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));

  for (const ns of namespaces) {
    // 1. 모든 locale에 namespace 파일이 있는지
    const localeMsgs = {};
    const localeKeys = {};
    let skip = false;

    for (const locale of locales) {
      const filePath = join(dir, locale, `${ns}.json`);
      if (!existsSync(filePath)) {
        reportError(pkg, ns, locale, '*', `namespace 파일 누락: ${locale}/${ns}.json`);
        skip = true;
        continue;
      }
      try {
        const raw = readFileSync(filePath, 'utf-8');
        localeMsgs[locale] = JSON.parse(raw);
        localeKeys[locale] = new Set(flattenKeys(localeMsgs[locale]));
      } catch (e) {
        reportError(pkg, ns, locale, '*', `JSON 파싱 실패: ${e.message}`);
        skip = true;
      }
    }

    if (skip) continue;

    // 2. Key parity 검사
    const allKeys = new Set();
    for (const keys of Object.values(localeKeys)) {
      for (const k of keys) allKeys.add(k);
    }

    for (const key of allKeys) {
      for (const locale of locales) {
        if (!localeKeys[locale].has(key)) {
          reportError(pkg, ns, locale, key, `key 누락 (다른 locale에는 존재)`);
        }
      }
    }

    // 3. Param parity 검사 + 빈 값 검사
    for (const key of allKeys) {
      const paramsByLocale = {};

      for (const locale of locales) {
        const value = getNestedValue(localeMsgs[locale], key);

        // 빈 값 검사
        if (typeof value === 'string' && value.trim() === '') {
          reportError(pkg, ns, locale, key, '빈 번역 값');
        }

        paramsByLocale[locale] = extractParams(value);
      }

      // param 비교 (기준: 첫 번째 locale)
      const baseParams = paramsByLocale[baseLocale];
      if (!baseParams) continue;

      for (const locale of locales) {
        if (locale === baseLocale) continue;
        const params = paramsByLocale[locale];
        if (!params) continue;

        const baseStr = baseParams.join(',');
        const localeStr = params.join(',');
        if (baseStr !== localeStr) {
          reportError(
            pkg,
            ns,
            locale,
            key,
            `param 불일치: ${baseLocale}=[${baseStr}] vs ${locale}=[${localeStr}]`,
          );
        }
      }
    }

    const keyCount = allKeys.size;
    console.log(`  ✓ ${ns}: ${keyCount} keys × ${locales.length} locales`);
  }
}

// ── Summary ──

console.log('');
if (totalErrors > 0) {
  console.error(`✗ i18n check FAILED: ${totalErrors} error(s) found`);
  process.exit(1);
} else {
  console.log('✓ i18n check passed');
}
