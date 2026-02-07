import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
  lastAccess: number;
}

const MAX_ENTRIES = 1000;
const CLEANUP_AGE_MS = 60 * 60 * 1000; // 1시간
const WINDOW_MS = 60 * 1000; // 1분

const store = new Map<string, RateLimitEntry>();

export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export function getRateLimit(pathname: string): number | null {
  if (pathname === '/api/health') return null;
  // Credentials endpoints – brute-force 방지 (1분 기준)
  // 실패 시에만 카운트하는 것이 이상적이지만, 현재는 모든 요청을 카운트
  if (pathname === '/api/auth/credentials-login') return 30; // 1분에 30회 (2초에 1회)
  if (pathname === '/api/auth/signup') return 10; // 1분에 10회
  if (pathname.startsWith('/api/auth/')) return 60;
  if (pathname.startsWith('/api/')) return 120;
  return null;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
}

export function checkRateLimit(ip: string, limit: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [], lastAccess: now };
    store.set(ip, entry);
  }

  entry.timestamps = entry.timestamps.filter((t): boolean => t > windowStart);
  entry.lastAccess = now;

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + WINDOW_MS - now) / 1000);

    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfter: Math.max(retryAfter, 1),
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    limit,
    remaining: limit - entry.timestamps.length,
    retryAfter: 0,
  };
}

export function cleanupStore(): void {
  if (store.size <= MAX_ENTRIES) return;

  const now = Date.now();
  for (const [ip, entry] of store) {
    if (now - entry.lastAccess > CLEANUP_AGE_MS) {
      store.delete(ip);
    }
  }
}

/** 테스트용 store 초기화 */
export function resetStore(): void {
  store.clear();
}
