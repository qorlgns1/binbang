import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkRateLimit, getRateLimit, isCrawler, resetStore } from '@/lib/rateLimit';

afterEach((): void => {
  resetStore();
  vi.restoreAllMocks();
});

describe('getRateLimit', (): void => {
  it('/api/health는 제한 없음', (): void => {
    expect(getRateLimit('/api/health')).toBeNull();
  });

  it('/availability/* 경로는 10초당 20회', (): void => {
    const config = getRateLimit('/ko/availability/airbnb/test-slug');
    expect(config).toEqual({ limit: 20, windowMs: 10_000 });
  });

  it('/api/auth/credentials-login은 분당 30회', (): void => {
    const config = getRateLimit('/api/auth/credentials-login');
    expect(config).toEqual({ limit: 30, windowMs: 60_000 });
  });

  it('/api/auth/signup은 분당 10회', (): void => {
    const config = getRateLimit('/api/auth/signup');
    expect(config).toEqual({ limit: 10, windowMs: 60_000 });
  });

  it('/api/auth/* 기타 경로는 분당 60회', (): void => {
    expect(getRateLimit('/api/auth/signin')).toEqual({ limit: 60, windowMs: 60_000 });
    expect(getRateLimit('/api/auth/callback/kakao')).toEqual({ limit: 60, windowMs: 60_000 });
  });

  it('/api/* 기본 경로는 분당 120회', (): void => {
    expect(getRateLimit('/api/accommodations')).toEqual({ limit: 120, windowMs: 60_000 });
    expect(getRateLimit('/api/users/me')).toEqual({ limit: 120, windowMs: 60_000 });
  });

  it('API 외 경로는 제한 없음', (): void => {
    expect(getRateLimit('/')).toBeNull();
    expect(getRateLimit('/pricing')).toBeNull();
  });
});

describe('checkRateLimit', (): void => {
  it('제한 미만 요청은 허용', (): void => {
    const result = checkRateLimit('127.0.0.1', { limit: 5, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('제한 도달 시 차단', (): void => {
    const config = { limit: 3, windowMs: 60_000 };
    for (let i = 0; i < config.limit; i++) {
      checkRateLimit('127.0.0.1', config);
    }

    const result = checkRateLimit('127.0.0.1', config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('윈도우 만료 후 다시 허용', (): void => {
    const config = { limit: 2, windowMs: 60_000 };

    checkRateLimit('127.0.0.1', config);
    checkRateLimit('127.0.0.1', config);
    expect(checkRateLimit('127.0.0.1', config).allowed).toBe(false);

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);

    const result = checkRateLimit('127.0.0.1', config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('IP별로 독립 추적', (): void => {
    const config = { limit: 1, windowMs: 60_000 };
    checkRateLimit('1.1.1.1', config);
    expect(checkRateLimit('1.1.1.1', config).allowed).toBe(false);

    const result = checkRateLimit('2.2.2.2', config);
    expect(result.allowed).toBe(true);
  });

  it('retryAfter는 최소 1초', (): void => {
    const config = { limit: 1, windowMs: 60_000 };
    checkRateLimit('127.0.0.1', config);

    const result = checkRateLimit('127.0.0.1', config);
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
  });

  it('커스텀 윈도우 적용', (): void => {
    const config = { limit: 5, windowMs: 10_000 }; // 10초 윈도우
    for (let i = 0; i < 5; i++) {
      checkRateLimit('127.0.0.1', config);
    }

    const result = checkRateLimit('127.0.0.1', config);
    expect(result.allowed).toBe(false);

    // 10초 후 허용
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 11_000);
    const afterWindow = checkRateLimit('127.0.0.1', config);
    expect(afterWindow.allowed).toBe(true);
  });
});

describe('isCrawler', (): void => {
  it('Googlebot 감지', (): void => {
    expect(isCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    expect(isCrawler('Googlebot-Image/1.0')).toBe(true);
  });

  it('Bingbot 감지', (): void => {
    expect(isCrawler('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
  });

  it('기타 크롤러 감지', (): void => {
    expect(isCrawler('facebookexternalhit/1.1')).toBe(true);
    expect(isCrawler('Slackbot-LinkExpanding 1.0')).toBe(true);
    expect(isCrawler('Twitterbot/1.0')).toBe(true);
  });

  it('일반 브라우저는 크롤러가 아님', (): void => {
    expect(isCrawler('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBe(false);
    expect(isCrawler('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15')).toBe(false);
  });

  it('null/undefined는 크롤러가 아님', (): void => {
    expect(isCrawler(null)).toBe(false);
    expect(isCrawler('')).toBe(false);
  });
});
