import type { NextRequest } from 'next/server';

interface RateLimitEntry {
  timestamps: number[];
  lastAccess: number;
}

const MAX_ENTRIES = 1000;
const CLEANUP_AGE_MS = 60 * 60 * 1000; // 1시간
const DEFAULT_WINDOW_MS = 60 * 1000; // 1분

const store = new Map<string, RateLimitEntry>();

/**
 * 요청에서 클라이언트 IP를 추출합니다.
 * `x-forwarded-for`(첫 번째), `x-real-ip` 순으로 확인하고 없으면 `'unknown'`을 반환합니다.
 */
export function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * User-Agent 문자열이 알려진 크롤러/봇 패턴과 일치하는지 여부를 반환합니다.
 * 비교 시 대소문자를 구분하지 않습니다.
 *
 * @param userAgent - 요청의 User-Agent 헤더 값 (또는 null)
 * @returns 크롤러로 판단되면 true
 */
export function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const crawlerPatterns = [
    'googlebot',
    'bingbot',
    'slurp', // Yahoo
    'duckduckbot',
    'baiduspider',
    'yandexbot',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest',
    'slackbot',
    'vkshare',
    'w3c_validator',
    'whatsapp',
  ];
  const lowerUA = userAgent.toLowerCase();
  return crawlerPatterns.some((pattern) => lowerUA.includes(pattern));
}

/** 경로별 레이트 제한 설정 (허용 횟수, 시간 창). */
export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

/**
 * pathname에 적용할 레이트 제한 설정을 반환합니다.
 * health 등 제한 없음 경로는 null을 반환합니다.
 *
 * @param pathname - 요청 경로 (예: `/api/auth/signup`)
 * @returns 해당 경로의 제한 설정 또는 null
 */
export function getRateLimit(pathname: string): RateLimitConfig | null {
  if (pathname === '/api/health') return null;

  // Availability pages - 10초당 20 요청
  if (pathname.includes('/availability/')) {
    return { limit: 20, windowMs: 10 * 1000 };
  }

  // Credentials endpoints – brute-force 방지 (1분 기준)
  // 실패 시에만 카운트하는 것이 이상적이지만, 현재는 모든 요청을 카운트
  if (pathname === '/api/auth/credentials-login') return { limit: 30, windowMs: DEFAULT_WINDOW_MS }; // 1분에 30회 (2초에 1회)
  if (pathname === '/api/auth/signup') return { limit: 10, windowMs: DEFAULT_WINDOW_MS }; // 1분에 10회
  if (pathname.startsWith('/api/auth/')) return { limit: 60, windowMs: DEFAULT_WINDOW_MS };
  if (pathname.startsWith('/api/')) return { limit: 120, windowMs: DEFAULT_WINDOW_MS };
  return null;
}

/** 레이트 제한 검사 결과. */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
}

/**
 * IP에 대해 레이트 제한을 검사합니다. 허용 시 카운트를 증가시킵니다.
 *
 * @param ip - 클라이언트 식별자 (보통 IP)
 * @param config - 이 경로에 적용되는 제한 설정
 * @returns 허용 여부, 남은 할당량, 재시도 시 예상 대기 시간(초)
 */
export function checkRateLimit(ip: string, config: RateLimitConfig): RateLimitResult {
  const { limit, windowMs } = config;
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [], lastAccess: now };
    store.set(ip, entry);
  }

  entry.timestamps = entry.timestamps.filter((t): boolean => t > windowStart);
  entry.lastAccess = now;

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);

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

/**
 * 오래 사용되지 않은 엔트리를 제거하여 store 크기를 제한합니다.
 * 엔트리 수가 MAX_ENTRIES 이하이면 아무 작업도 하지 않습니다.
 */
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
