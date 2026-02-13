import { afterEach, describe, expect, it, vi } from 'vitest';

// next/headers mock
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

import { cookies, headers } from 'next/headers';

import { resolveServerLocale } from './server';

/** 쿠키 스토어 mock 헬퍼 */
function mockCookies(map: Record<string, string> = {}): void {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name in map ? { name, value: map[name] } : undefined),
  } as ReturnType<typeof cookies> extends Promise<infer U> ? U : never);
}

/** 헤더 스토어 mock 헬퍼 */
function mockHeaders(map: Record<string, string> = {}): void {
  vi.mocked(headers).mockResolvedValue({
    get: (name: string) => map[name] ?? null,
  } as ReturnType<typeof headers> extends Promise<infer U> ? U : never);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('resolveServerLocale', () => {
  it('URL locale가 최우선이다', async () => {
    mockCookies({ 'binbang-lang': 'ko' });
    mockHeaders({ 'accept-language': 'ko' });

    const result = await resolveServerLocale({ urlLocale: 'en', userPreferredLocale: 'ko' });
    expect(result).toEqual({ locale: 'en', source: 'url' });
  });

  it('URL 없으면 userPreferredLocale(DB)이 우선이다', async () => {
    mockCookies({ 'binbang-lang': 'ko' });
    mockHeaders({ 'accept-language': 'ko' });

    const result = await resolveServerLocale({ userPreferredLocale: 'en' });
    expect(result).toEqual({ locale: 'en', source: 'userProfile' });
  });

  it('URL, userPreferredLocale 없으면 cookie가 우선이다', async () => {
    mockCookies({ 'binbang-lang': 'en' });
    mockHeaders({ 'accept-language': 'ko' });

    const result = await resolveServerLocale({});
    expect(result).toEqual({ locale: 'en', source: 'cookie' });
  });

  it('URL, userPreferredLocale, cookie 없으면 Accept-Language를 사용한다', async () => {
    mockCookies({});
    mockHeaders({ 'accept-language': 'en-US,en;q=0.9' });

    const result = await resolveServerLocale({});
    expect(result).toEqual({ locale: 'en', source: 'acceptLanguage' });
  });

  it('모든 소스가 없으면 default(ko)를 반환한다', async () => {
    mockCookies({});
    mockHeaders({});

    const result = await resolveServerLocale({});
    expect(result).toEqual({ locale: 'ko', source: 'default' });
  });

  it('무효한 userPreferredLocale은 건너뛴다', async () => {
    mockCookies({ 'binbang-lang': 'en' });
    mockHeaders({});

    const result = await resolveServerLocale({ userPreferredLocale: 'fr' });
    expect(result).toEqual({ locale: 'en', source: 'cookie' });
  });

  it('인자 없이 호출하면 cookie/header에서 결정한다', async () => {
    mockCookies({});
    mockHeaders({ 'accept-language': 'en' });

    const result = await resolveServerLocale();
    expect(result).toEqual({ locale: 'en', source: 'acceptLanguage' });
  });
});
