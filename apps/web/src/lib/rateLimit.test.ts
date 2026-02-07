import { afterEach, describe, expect, it, vi } from 'vitest';

import { checkRateLimit, getRateLimit, resetStore } from '@/lib/rateLimit';

afterEach((): void => {
  resetStore();
  vi.restoreAllMocks();
});

describe('getRateLimit', (): void => {
  it('/api/health는 제한 없음', (): void => {
    expect(getRateLimit('/api/health')).toBeNull();
  });

  it('/api/auth/credentials-login은 분당 30회', (): void => {
    expect(getRateLimit('/api/auth/credentials-login')).toBe(30);
  });

  it('/api/auth/signup은 분당 10회', (): void => {
    expect(getRateLimit('/api/auth/signup')).toBe(10);
  });

  it('/api/auth/* 기타 경로는 분당 60회', (): void => {
    expect(getRateLimit('/api/auth/signin')).toBe(60);
    expect(getRateLimit('/api/auth/callback/kakao')).toBe(60);
  });

  it('/api/* 기본 경로는 분당 120회', (): void => {
    expect(getRateLimit('/api/accommodations')).toBe(120);
    expect(getRateLimit('/api/users/me')).toBe(120);
  });

  it('API 외 경로는 제한 없음', (): void => {
    expect(getRateLimit('/')).toBeNull();
    expect(getRateLimit('/accommodations')).toBeNull();
  });
});

describe('checkRateLimit', (): void => {
  it('제한 미만 요청은 허용', (): void => {
    const result = checkRateLimit('127.0.0.1', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('제한 도달 시 차단', (): void => {
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      checkRateLimit('127.0.0.1', limit);
    }

    const result = checkRateLimit('127.0.0.1', limit);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('윈도우 만료 후 다시 허용', (): void => {
    const limit = 2;

    checkRateLimit('127.0.0.1', limit);
    checkRateLimit('127.0.0.1', limit);
    expect(checkRateLimit('127.0.0.1', limit).allowed).toBe(false);

    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);

    const result = checkRateLimit('127.0.0.1', limit);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('IP별로 독립 추적', (): void => {
    const limit = 1;
    checkRateLimit('1.1.1.1', limit);
    expect(checkRateLimit('1.1.1.1', limit).allowed).toBe(false);

    const result = checkRateLimit('2.2.2.2', limit);
    expect(result.allowed).toBe(true);
  });

  it('retryAfter는 최소 1초', (): void => {
    const limit = 1;
    checkRateLimit('127.0.0.1', limit);

    const result = checkRateLimit('127.0.0.1', limit);
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
  });
});
