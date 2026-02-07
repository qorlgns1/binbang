import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getEnv, getEnvNumber } from '@/lib/env';

const ORIGINAL_ENV = process.env;

beforeEach((): void => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach((): void => {
  process.env = ORIGINAL_ENV;
});

describe('getEnv', (): void => {
  it('returns default when missing', (): void => {
    delete process.env.TEST_ENV;
    expect(getEnv('TEST_ENV', 'default')).toBe('default');
  });

  it('throws when missing and no default', (): void => {
    delete process.env.TEST_ENV;
    expect((): string => getEnv('TEST_ENV')).toThrowError(/TEST_ENV/);
  });

  it('returns value when present', (): void => {
    process.env.TEST_ENV = 'value';
    expect(getEnv('TEST_ENV')).toBe('value');
  });
});

describe('getEnvNumber', (): void => {
  it('returns default when missing', (): void => {
    delete process.env.TEST_NUM;
    expect(getEnvNumber('TEST_NUM', 7)).toBe(7);
  });

  it('parses number when valid', (): void => {
    process.env.TEST_NUM = '42';
    expect(getEnvNumber('TEST_NUM', 7)).toBe(42);
  });

  it('returns default and warns when invalid', (): void => {
    process.env.TEST_NUM = 'abc';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation((): undefined => undefined);
    expect(getEnvNumber('TEST_NUM', 7)).toBe(7);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });
});
