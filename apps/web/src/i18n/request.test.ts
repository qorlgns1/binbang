import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'node:fs/promises';

import { getNamespacesForRoute, getRequestMessages, loadMessages } from './request';

beforeEach(() => {
  vi.mocked(readFile).mockReset();
});

describe('getNamespacesForRoute', () => {
  it('(public) 그룹은 common + landing을 반환한다', () => {
    expect(getNamespacesForRoute('(public)')).toEqual(['common', 'landing']);
  });

  it('(app) 그룹은 common + app을 반환한다', () => {
    expect(getNamespacesForRoute('(app)')).toEqual(['common', 'app']);
  });

  it('admin 그룹은 common + admin을 반환한다', () => {
    expect(getNamespacesForRoute('admin')).toEqual(['common', 'admin']);
  });

  it('매핑에 없는 route group은 common만 반환한다', () => {
    expect(getNamespacesForRoute('unknown')).toEqual(['common']);
  });
});

describe('loadMessages', () => {
  it('지정된 namespace들의 메시지를 병렬 로드한다', async () => {
    const commonJson = JSON.stringify({ brand: 'Binbang', loading: '로딩 중...' });
    const landingJson = JSON.stringify({ hero: { headline: '테스트' } });

    vi.mocked(readFile).mockImplementation(async (path) => {
      const p = String(path);
      if (p.endsWith('ko/common.json')) return commonJson;
      if (p.endsWith('ko/landing.json')) return landingJson;
      throw new Error(`Not found: ${p}`);
    });

    const result = await loadMessages('ko', ['common', 'landing']);

    expect(result).toEqual({
      common: { brand: 'Binbang', loading: '로딩 중...' },
      landing: { hero: { headline: '테스트' } },
    });
  });

  it('단일 namespace도 정상 로드한다', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ brand: 'Binbang' }));

    const result = await loadMessages('en', ['common']);

    expect(result).toEqual({ common: { brand: 'Binbang' } });
  });

  it('파일이 없으면 에러를 전파한다', async () => {
    vi.mocked(readFile).mockRejectedValue(new Error('ENOENT'));

    await expect(loadMessages('ko', ['missing'])).rejects.toThrow('ENOENT');
  });
});

describe('getRequestMessages', () => {
  it('route group에 매핑된 namespace만 로드한다', async () => {
    const commonJson = JSON.stringify({ brand: 'Binbang' });
    const landingJson = JSON.stringify({ hero: { headline: '테스트' } });

    vi.mocked(readFile).mockImplementation(async (path) => {
      const p = String(path);
      if (p.endsWith('ko/common.json')) return commonJson;
      if (p.endsWith('ko/landing.json')) return landingJson;
      throw new Error(`Unexpected: ${p}`);
    });

    const result = await getRequestMessages('ko', '(public)');

    expect(result).toEqual({
      common: { brand: 'Binbang' },
      landing: { hero: { headline: '테스트' } },
    });
    expect(readFile).toHaveBeenCalledTimes(2);
  });

  it('매핑에 없는 route group은 common만 로드한다', async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ brand: 'Binbang' }));

    const result = await getRequestMessages('en', 'unknown');

    expect(result).toEqual({ common: { brand: 'Binbang' } });
    expect(readFile).toHaveBeenCalledTimes(1);
  });
});
