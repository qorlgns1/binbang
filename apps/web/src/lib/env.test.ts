import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getEnv, getEnvNumber, validateWebEnv } from '@/lib/env';

const ORIGINAL_ENV = process.env;
const REQUIRED_WEB_ENV = {
  ORACLE_USER: 'app_user',
  ORACLE_PASSWORD: 'app_password',
  ORACLE_CONNECT_STRING: 'tcps://localhost:1522/binbang_high.adb.oraclecloud.com',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'test-secret',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  KAKAO_CLIENT_ID: 'kakao-client-id',
  KAKAO_CLIENT_SECRET: 'kakao-client-secret',
};

beforeEach((): void => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach((): void => {
  process.env = ORIGINAL_ENV;
});

function setRequiredWebEnv(overrides: Partial<typeof REQUIRED_WEB_ENV> = {}): void {
  Object.assign(process.env, REQUIRED_WEB_ENV, overrides);
}

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

  it('treats blank values as missing', (): void => {
    process.env.TEST_ENV = '   ';
    expect((): string => getEnv('TEST_ENV')).toThrowError(/TEST_ENV/);
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

describe('validateWebEnv', (): void => {
  it('passes when required values are present and valid', (): void => {
    setRequiredWebEnv();
    expect((): void => validateWebEnv()).not.toThrow();
  });

  it('throws when a required value is blank', (): void => {
    setRequiredWebEnv({ NEXTAUTH_SECRET: '   ' });
    expect((): void => validateWebEnv()).toThrowError(/NEXTAUTH_SECRET/);
  });

  it('throws when NEXTAUTH_URL is invalid', (): void => {
    setRequiredWebEnv({ NEXTAUTH_URL: 'not-a-url' });
    expect((): void => validateWebEnv()).toThrowError(/NEXTAUTH_URL/);
  });

  it('throws when optional WORKER_INTERNAL_URL is invalid', (): void => {
    setRequiredWebEnv();
    process.env.WORKER_INTERNAL_URL = 'tcp://worker:3500';
    expect((): void => validateWebEnv()).toThrowError(/WORKER_INTERNAL_URL/);
  });
});
