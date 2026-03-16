import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getBinbangCronConfig, getEnv, getEnvNumber, getTravelCachePrewarmConfig, validateWorkerEnv } from './env';

const ORIGINAL_ENV = process.env;
const REQUIRED_WORKER_ENV = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/accommodation_monitor',
  REDIS_URL: 'redis://localhost:6379',
};

beforeEach((): void => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach((): void => {
  process.env = ORIGINAL_ENV;
});

function setRequiredWorkerEnv(overrides: Partial<typeof REQUIRED_WORKER_ENV> = {}): void {
  Object.assign(process.env, REQUIRED_WORKER_ENV, overrides);
}

describe('getEnv', (): void => {
  it('returns a default when missing', (): void => {
    delete process.env.TEST_ENV;
    expect(getEnv('TEST_ENV', 'fallback')).toBe('fallback');
  });

  it('throws when value is blank and no default exists', (): void => {
    process.env.TEST_ENV = '   ';
    expect((): string => getEnv('TEST_ENV')).toThrowError(/TEST_ENV/);
  });
});

describe('getEnvNumber', (): void => {
  it('returns default when value is invalid', (): void => {
    process.env.TEST_NUM = 'abc';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation((): undefined => undefined);

    expect(getEnvNumber('TEST_NUM', 9)).toBe(9);
    expect(warnSpy).toHaveBeenCalledOnce();

    warnSpy.mockRestore();
  });
});

describe('validateWorkerEnv', (): void => {
  it('passes when DATABASE_URL and REDIS_URL are valid', (): void => {
    setRequiredWorkerEnv();
    expect((): void => validateWorkerEnv()).not.toThrow();
  });

  it('throws when REDIS_URL uses an invalid scheme', (): void => {
    setRequiredWorkerEnv({ REDIS_URL: 'http://localhost:6379' });
    expect((): void => validateWorkerEnv()).toThrowError(/REDIS_URL/);
  });
});

describe('getTravelCachePrewarmConfig', (): void => {
  it('throws when TRAVEL_INTERNAL_URL is invalid', (): void => {
    process.env.TRAVEL_INTERNAL_URL = 'redis://localhost:3300';
    expect((): ReturnType<typeof getTravelCachePrewarmConfig> => getTravelCachePrewarmConfig()).toThrowError(
      /TRAVEL_INTERNAL_URL/,
    );
  });
});

describe('getBinbangCronConfig', (): void => {
  it('throws when WEB_INTERNAL_URL is invalid', (): void => {
    process.env.WEB_INTERNAL_URL = 'redis://localhost:3000';
    expect((): ReturnType<typeof getBinbangCronConfig> => getBinbangCronConfig()).toThrowError(/WEB_INTERNAL_URL/);
  });
});
