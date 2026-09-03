import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getBinbangRuntimeSettings } from './binbang-runtime-settings.service';

const dbMock = vi.hoisted(() => ({ find: vi.fn(), getDataSource: vi.fn() }));

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  dbMock.getDataSource.mockResolvedValue({
    getRepository: () => ({ find: dbMock.find }),
  });
  return { ...actual, getDataSource: dbMock.getDataSource };
});

describe('getBinbangRuntimeSettings — e2e 메일 차단', (): void => {
  const originalFlag = process.env.BINBANG_ENABLE_E2E_ENDPOINTS;

  function setNodeEnv(value: string): void {
    (process.env as Record<string, string>).NODE_ENV = value;
  }

  beforeEach((): void => {
    vi.clearAllMocks();
    setNodeEnv('development');
    delete process.env.BINBANG_ENABLE_E2E_ENDPOINTS;
    dbMock.getDataSource.mockResolvedValue({
      getRepository: () => ({ find: dbMock.find }),
    });
    // DB 는 resend 를 지시한다 (로컬과 dev 서버가 공유하는 실제 상태).
    dbMock.find.mockResolvedValue([{ key: 'binbang.emailProvider', value: 'resend' }]);
  });

  afterEach((): void => {
    setNodeEnv('test');
    if (originalFlag === undefined) delete process.env.BINBANG_ENABLE_E2E_ENDPOINTS;
    else process.env.BINBANG_ENABLE_E2E_ENDPOINTS = originalFlag;
  });

  it('평상시에는 DB 의 emailProvider 를 그대로 따른다', async (): Promise<void> => {
    const settings = await getBinbangRuntimeSettings(true);
    expect(settings.emailProvider).toBe('resend');
  });

  it('e2e 플래그가 켜져 있으면 DB 가 resend 여도 console 로 내린다', async (): Promise<void> => {
    process.env.BINBANG_ENABLE_E2E_ENDPOINTS = 'true';

    const settings = await getBinbangRuntimeSettings(true);

    // 공유 SystemSettings 를 건드리지 않고도 테스트가 실제 메일을 보내지 않는다.
    expect(settings.emailProvider).toBe('console');
  });

  it('production 에서는 플래그가 켜져 있어도 DB 설정을 따른다', async (): Promise<void> => {
    setNodeEnv('production');
    process.env.BINBANG_ENABLE_E2E_ENDPOINTS = 'true';

    const settings = await getBinbangRuntimeSettings(true);

    expect(settings.emailProvider).toBe('resend');
  });
});
