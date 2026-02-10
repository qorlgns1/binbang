/**
 * Platform Selector Loader (Runtime)
 *
 * 플랫폼별 셀렉터/패턴을 DB에서 로드하고 캐싱합니다.
 * browser/는 DB에 접근하지 않고, runtime이 로드한 데이터를 주입받습니다.
 */
import { type Platform, type SelectorCategory, prisma } from '@workspace/db';
import type { PlatformSelectorCache } from '@workspace/shared/types';
import { AGODA_PATTERNS, AIRBNB_PATTERNS } from '@workspace/shared';

// ============================================
// Cache
// ============================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분
const cache = new Map<Platform, PlatformSelectorCache>();

// ============================================
// Fallback
// ============================================

function getHardcodedFallback(platform: Platform): PlatformSelectorCache {
  const patterns = platform === 'AIRBNB' ? AIRBNB_PATTERNS : AGODA_PATTERNS;

  return {
    selectors: {
      price: [],
      availability: [],
      metadata: [],
      platformId: [],
    },
    patterns,
    extractorCode: '',
    loadedAt: 0,
  };
}

// ============================================
// Category Mapping
// ============================================

const CATEGORY_MAP: Record<SelectorCategory, keyof PlatformSelectorCache['selectors']> = {
  PRICE: 'price',
  AVAILABILITY: 'availability',
  METADATA: 'metadata',
  PLATFORM_ID: 'platformId',
};

// ============================================
// Extractor Code Builder
// ============================================

function escapeSelector(selector: string): string {
  return selector.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

/**
 * 셀렉터 캐시를 기반으로 page.evaluate()에서 실행할 JavaScript 함수 문자열을 생성합니다.
 */
export function buildExtractorCode(_platform: Platform, selectorCache: PlatformSelectorCache): string {
  const { selectors, patterns } = selectorCache;

  const hasSelectors =
    selectors.price.length > 0 ||
    selectors.availability.length > 0 ||
    selectors.metadata.length > 0 ||
    selectors.platformId.length > 0;

  if (!hasSelectors) {
    return '';
  }

  const priceExtractors = selectors.price
    .map((s): string => {
      if (s.extractorCode) {
        return `
      // ${s.name}
      try {
        const el = document.querySelector('${escapeSelector(s.selector)}');
        if (el) {
          const extractFn = function(el) { ${s.extractorCode} };
          const result = extractFn(el);
          if (result) {
            price = result;
            matchedSelectors.push({ category: 'PRICE', name: '${escapeSelector(s.name)}', matched: true });
          }
        }
      } catch (e) { /* ignore */ }`;
      }
      return `
      // ${s.name}
      try {
        const el = document.querySelector('${escapeSelector(s.selector)}');
        if (el) {
          const text = el.innerText || el.getAttribute('aria-label') || '';
          const match = text.match(/[₩$€£][\\s]*[\\d,]+/);
          if (match) {
            price = match[0].replace(/\\s/g, '').replace(/,$/g, '');
            matchedSelectors.push({ category: 'PRICE', name: '${escapeSelector(s.name)}', matched: true });
          }
        }
      } catch (e) { /* ignore */ }`;
    })
    .join('\n');

  const metadataExtractors = selectors.metadata
    .map((s): string => {
      if (s.extractorCode) {
        return `
      // ${s.name}
      try {
        const els = document.querySelectorAll('${escapeSelector(s.selector)}');
        for (const el of els) {
          const extractFn = function(el) { ${s.extractorCode} };
          const result = extractFn(el);
          if (result) {
            metadata = { ...metadata, ...result };
            matchedSelectors.push({ category: 'METADATA', name: '${escapeSelector(s.name)}', matched: true });
            break;
          }
        }
      } catch (e) { /* ignore */ }`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  const platformIdExtractors = selectors.platformId
    .map((s): string => {
      if (s.extractorCode) {
        return `
      // ${s.name}
      try {
        const extractFn = function() { ${s.extractorCode} };
        const result = extractFn();
        if (result) {
          metadata.platformId = result;
          matchedSelectors.push({ category: 'PLATFORM_ID', name: '${escapeSelector(s.name)}', matched: true });
        }
      } catch (e) { /* ignore */ }`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n');

  const availabilityChecks = selectors.availability
    .map((s): string => {
      const isUnavailable = s.name.toLowerCase().includes('unavailable');
      return `
      // ${s.name}
      try {
        const el = document.querySelector('${escapeSelector(s.selector)}');
        if (el) {
          ${isUnavailable ? 'hasUnavailableElement = true;' : 'hasAvailableElement = true;'}
          matchedSelectors.push({ category: 'AVAILABILITY', name: '${escapeSelector(s.name)}', matched: true });
        }
      } catch (e) { /* ignore */ }`;
    })
    .join('\n');

  return `function() {
  let price = null;
  let metadata = {};
  let hasAvailableElement = false;
  let hasUnavailableElement = false;
  const matchedSelectors = [];
  const matchedPatterns = [];

  // ============================================
  // 1. 플랫폼 ID 추출
  // ============================================
  ${platformIdExtractors || '// No platform ID selectors'}

  // ============================================
  // 2. 메타데이터 추출 (JSON-LD 등)
  // ============================================
  ${metadataExtractors || '// No metadata selectors'}

  // ============================================
  // 3. 가격 추출
  // ============================================
  ${priceExtractors || '// No price selectors'}

  // ============================================
  // 4. 가용성 확인 (셀렉터 기반)
  // ============================================
  ${availabilityChecks || '// No availability selectors'}

  // ============================================
  // 5. 가용성 확인 (텍스트 패턴 기반)
  // ============================================
  const bodyText = document.body.innerText || '';
  const availablePatterns = ${JSON.stringify(patterns.available)};
  const unavailablePatterns = ${JSON.stringify(patterns.unavailable)};

  let hasAvailablePattern = false;
  let hasUnavailablePattern = false;

  for (const pattern of availablePatterns) {
    if (bodyText.includes(pattern)) {
      hasAvailablePattern = true;
      matchedPatterns.push({ type: 'AVAILABLE', pattern, matched: true });
      break;
    }
  }

  for (const pattern of unavailablePatterns) {
    if (bodyText.includes(pattern)) {
      hasUnavailablePattern = true;
      matchedPatterns.push({ type: 'UNAVAILABLE', pattern, matched: true });
      break;
    }
  }

  // ============================================
  // 6. 결과 판정
  // ============================================

  if (price) {
    return {
      matched: true,
      available: true,
      price: price,
      reason: 'price extracted',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      matchedSelectors,
      matchedPatterns
    };
  }

  if (hasUnavailableElement || hasUnavailablePattern) {
    return {
      matched: true,
      available: false,
      price: null,
      reason: hasUnavailableElement ? 'unavailable element found' : 'unavailable pattern matched',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      matchedSelectors,
      matchedPatterns
    };
  }

  if (hasAvailableElement || hasAvailablePattern) {
    return {
      matched: true,
      available: true,
      price: '가격 확인 필요',
      reason: hasAvailableElement ? 'available element found' : 'available pattern matched',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      matchedSelectors,
      matchedPatterns
    };
  }

  return {
    matched: false,
    available: false,
    price: null,
    reason: null,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    matchedSelectors,
    matchedPatterns
  };
}`;
}

// ============================================
// Public API
// ============================================

/**
 * 플랫폼별 셀렉터 캐시를 반환합니다.
 * 캐시 미스/만료 시 fallback을 반환하고 비동기로 갱신합니다.
 */
export function getPlatformSelectors(platform: Platform): PlatformSelectorCache {
  const cached = cache.get(platform);

  if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached;
  }

  const result = cached ?? getHardcodedFallback(platform);

  loadPlatformSelectors(platform).catch((err): void => {
    console.warn(`[selectors] Failed to load selectors for ${platform}:`, err);
  });

  return result;
}

/**
 * DB에서 플랫폼 셀렉터를 로드하고 캐시를 갱신합니다.
 */
export async function loadPlatformSelectors(platform: Platform, force = false): Promise<PlatformSelectorCache> {
  const cached = cache.get(platform);

  if (!force && cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const dbSelectors = await prisma.platformSelector.findMany({
      where: { platform, isActive: true },
      orderBy: { priority: 'desc' },
    });

    const dbPatterns = await prisma.platformPattern.findMany({
      where: { platform, isActive: true },
      orderBy: { priority: 'desc' },
    });

    const selectors: PlatformSelectorCache['selectors'] = {
      price: [],
      availability: [],
      metadata: [],
      platformId: [],
    };

    for (const s of dbSelectors) {
      const key = CATEGORY_MAP[s.category];
      selectors[key].push({
        id: s.id,
        name: s.name,
        selector: s.selector,
        extractorCode: s.extractorCode,
        priority: s.priority,
      });
    }

    const fallback = getHardcodedFallback(platform);
    const hasPatterns = dbPatterns.length > 0;

    const patterns: PlatformSelectorCache['patterns'] = hasPatterns
      ? {
          available: dbPatterns.filter((p): boolean => p.patternType === 'AVAILABLE').map((p): string => p.pattern),
          unavailable: dbPatterns.filter((p): boolean => p.patternType === 'UNAVAILABLE').map((p): string => p.pattern),
        }
      : fallback.patterns;

    const newCache: PlatformSelectorCache = {
      selectors,
      patterns,
      extractorCode: '',
      loadedAt: Date.now(),
    };

    newCache.extractorCode = buildExtractorCode(platform, newCache);
    cache.set(platform, newCache);

    console.log(
      `[selectors] Loaded ${platform}: ${dbSelectors.length} selectors, ${dbPatterns.length} patterns` +
        (hasPatterns ? '' : ' (using fallback patterns)'),
    );

    return newCache;
  } catch (err) {
    console.error('[selectors] Failed to load from DB for %s:', platform, err);

    const fallback = getHardcodedFallback(platform);
    fallback.loadedAt = Date.now();
    cache.set(platform, fallback);

    return fallback;
  }
}

/**
 * 셀렉터 캐시를 무효화합니다.
 */
export function invalidateSelectorCache(platform?: Platform): Platform[] {
  const invalidated: Platform[] = [];

  if (platform) {
    if (cache.has(platform)) {
      cache.delete(platform);
      invalidated.push(platform);
    }
  } else {
    for (const key of cache.keys()) {
      cache.delete(key);
      invalidated.push(key);
    }
  }

  console.log(`[selectors] Cache invalidated:`, invalidated);

  return invalidated;
}

/**
 * 모든 플랫폼 셀렉터 캐시를 미리 로드합니다.
 */
export async function preloadSelectorCache(): Promise<void> {
  const platforms: Platform[] = ['AIRBNB', 'AGODA'];

  await Promise.all(platforms.map((p): Promise<PlatformSelectorCache> => loadPlatformSelectors(p, true)));

  console.log(`[selectors] Preloaded cache for all platforms`);
}
