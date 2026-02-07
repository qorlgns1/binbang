import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getEnv, getEnvNumber } from '@/lib/env';

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe('getEnv', () => {
  it('returns default when missing', () => {
    delete process.env.TEST_ENV;
    expect(getEnv('TEST_ENV', 'default')).toBe('default');
  });

  it('throws when missing and no default', () => {
    delete process.env.TEST_ENV;
    expect(() => getEnv('TEST_ENV')).toThrowError(/TEST_ENV/);
  });

  it('returns value when present', () => {
    process.env.TEST_ENV = 'value';
    expect(getEnv('TEST_ENV')).toBe('value');
  });
});

describe('getEnvNumber', () => {
  it('returns default when missing', () => {
    delete process.env.TEST_NUM;
    expect(getEnvNumber('TEST_NUM', 7)).toBe(7);
  });

  it('parses number when valid', () => {
    process.env.TEST_NUM = '42';
    expect(getEnvNumber('TEST_NUM', 7)).toBe(42);
  });

  it('returns default and warns when invalid', () => {
    process.env.TEST_NUM = 'abc';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(getEnvNumber('TEST_NUM', 7)).toBe(7);
    expect(warnSpy).toHaveBeenCalledOnce();
    warnSpy.mockRestore();
  });
});
