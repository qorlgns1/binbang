import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { areTestEndpointsEnabled } from './testEndpointGuard';

describe('areTestEndpointsEnabled', (): void => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFlag = process.env.BINBANG_ENABLE_E2E_ENDPOINTS;

  function setNodeEnv(value: string): void {
    // NODE_ENV 는 읽기 전용 타입이라 테스트에서만 우회한다.
    (process.env as Record<string, string>).NODE_ENV = value;
  }

  beforeEach((): void => {
    delete process.env.BINBANG_ENABLE_E2E_ENDPOINTS;
  });

  afterEach((): void => {
    setNodeEnv(originalNodeEnv ?? 'test');
    if (originalFlag === undefined) delete process.env.BINBANG_ENABLE_E2E_ENDPOINTS;
    else process.env.BINBANG_ENABLE_E2E_ENDPOINTS = originalFlag;
  });

  it('기본값은 비활성 — 플래그가 없으면 열리지 않는다', (): void => {
    setNodeEnv('development');
    expect(areTestEndpointsEnabled()).toBe(false);
  });

  it('배포된 development 환경에서도 플래그가 없으면 비활성', (): void => {
    setNodeEnv('development');
    process.env.BINBANG_ENABLE_E2E_ENDPOINTS = 'false';
    expect(areTestEndpointsEnabled()).toBe(false);
  });

  it('플래그를 켜면 활성', (): void => {
    setNodeEnv('development');
    process.env.BINBANG_ENABLE_E2E_ENDPOINTS = 'true';
    expect(areTestEndpointsEnabled()).toBe(true);
  });

  it('production 에서는 플래그가 켜져 있어도 비활성', (): void => {
    setNodeEnv('production');
    process.env.BINBANG_ENABLE_E2E_ENDPOINTS = 'true';
    expect(areTestEndpointsEnabled()).toBe(false);
  });
});
