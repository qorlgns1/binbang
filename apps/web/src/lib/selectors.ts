/**
 * Platform Selector utilities for web app API routes
 * Direct DB access implementation - does not import from @workspace/shared/worker
 */
import { type Platform, type SelectorCategory, prisma } from '@workspace/db';
import { AGODA_PATTERNS, AIRBNB_PATTERNS } from '@workspace/shared';

// ============================================
// Types
// ============================================

export interface SelectorConfig {
  id: string;
  name: string;
  selector: string;
  extractorCode?: string | null;
  priority: number;
}

export interface PlatformSelectorCache {
  selectors: {
    price: SelectorConfig[];
    availability: SelectorConfig[];
    metadata: SelectorConfig[];
    platformId: SelectorConfig[];
  };
  patterns: {
    available: string[];
    unavailable: string[];
  };
  extractorCode: string;
  loadedAt: number;
}

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
// Public API
// ============================================

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

    cache.set(platform, newCache);

    return newCache;
  } catch (err) {
    console.error(`[selectors] Failed to load from DB for ${platform}:`, err);

    const fallback = getHardcodedFallback(platform);
    fallback.loadedAt = Date.now();
    cache.set(platform, fallback);

    return fallback;
  }
}

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
