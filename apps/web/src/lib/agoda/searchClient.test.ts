import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AgodaSearchForbiddenError,
  AgodaSearchRequestError,
  computeBackoffMs,
  parseRetryAfterMs,
  searchAgodaAvailability,
} from './searchClient';

const BASE_REQUEST = {
  criteria: {
    propertyIds: [1126n],
    checkIn: '2026-09-01',
    checkOut: '2026-09-02',
    rooms: 1,
    adults: 2,
  },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function errorResponse(status: number, body = 'boom', headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers });
}

describe('searchClient', (): void => {
  const fetchMock = vi.fn();

  beforeEach((): void => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    process.env.AGODA_AFFILIATE_SITE_ID = 'site';
    process.env.AGODA_AFFILIATE_API_KEY = 'key';
    // 대기를 즉시 끝내 테스트가 실제 백오프만큼 멈추지 않게 한다.
    vi.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    }) as unknown as typeof setTimeout);
  });

  afterEach((): void => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('parseRetryAfterMs', (): void => {
    it('초 단위 정수를 밀리초로 바꾼다', (): void => {
      expect(parseRetryAfterMs('2')).toBe(2000);
    });

    it('상한(8초)을 넘지 않는다', (): void => {
      expect(parseRetryAfterMs('600')).toBe(8000);
    });

    it('HTTP-date 형식도 처리한다', (): void => {
      const future = new Date(Date.now() + 3000).toUTCString();
      const parsed = parseRetryAfterMs(future);
      expect(parsed).toBeGreaterThan(0);
      expect(parsed).toBeLessThanOrEqual(8000);
    });

    it('과거 시각은 0으로 눌러 즉시 재시도한다', (): void => {
      expect(parseRetryAfterMs(new Date(Date.now() - 10_000).toUTCString())).toBe(0);
    });

    it('해석할 수 없으면 null (호출부가 지수 백오프로 대체)', (): void => {
      expect(parseRetryAfterMs('later')).toBeNull();
      expect(parseRetryAfterMs(null)).toBeNull();
    });
  });

  describe('computeBackoffMs', (): void => {
    it('시도가 늘수록 커지고 상한을 넘지 않는다', (): void => {
      const noJitter = (): number => 1;
      expect(computeBackoffMs(1, noJitter)).toBe(500);
      expect(computeBackoffMs(2, noJitter)).toBe(1000);
      expect(computeBackoffMs(10, noJitter)).toBe(8000);
    });

    it('지터로 최소 절반까지 줄어든다', (): void => {
      expect(computeBackoffMs(1, () => 0)).toBe(250);
    });
  });

  describe('searchAgodaAvailability', (): void => {
    it('성공하면 attempts=1 로 돌려준다', async (): Promise<void> => {
      fetchMock.mockResolvedValue(jsonResponse({ results: [] }));

      const result = await searchAgodaAvailability(BASE_REQUEST);

      expect(result.attempts).toBe(1);
      expect(result.httpStatus).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('429면 재시도하고 성공 시 시도 횟수를 보고한다', async (): Promise<void> => {
      fetchMock
        .mockResolvedValueOnce(errorResponse(429, 'slow down', { 'retry-after': '1' }))
        .mockResolvedValueOnce(jsonResponse({ results: [] }));

      const result = await searchAgodaAvailability(BASE_REQUEST);

      expect(result.attempts).toBe(2);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('5xx도 재시도한다', async (): Promise<void> => {
      fetchMock.mockResolvedValueOnce(errorResponse(503)).mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await searchAgodaAvailability(BASE_REQUEST);

      expect(result.attempts).toBe(2);
    });

    it('403은 재시도하지 않고 전용 에러를 던진다', async (): Promise<void> => {
      fetchMock.mockResolvedValue(errorResponse(403, 'quota exceeded'));

      await expect(searchAgodaAvailability(BASE_REQUEST)).rejects.toBeInstanceOf(AgodaSearchForbiddenError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('400 같은 비재시도 4xx도 한 번만 보낸다', async (): Promise<void> => {
      fetchMock.mockResolvedValue(errorResponse(400, 'bad request'));

      await expect(searchAgodaAvailability(BASE_REQUEST)).rejects.toBeInstanceOf(AgodaSearchRequestError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('재시도 한도를 넘으면 마지막 에러를 던진다', async (): Promise<void> => {
      fetchMock.mockResolvedValue(errorResponse(429, 'still limited'));

      await expect(searchAgodaAvailability(BASE_REQUEST)).rejects.toThrow(/429/);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
