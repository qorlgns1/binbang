import { describe, expect, it } from 'vitest';

import { getAllNamespaces, getNamespacesForPathname } from './namespaces';

describe('getNamespacesForPathname', () => {
  describe('public 라우트 — PublicHeader base (common + landing + pricing)', () => {
    it('landing (/ko)', () => {
      expect(getNamespacesForPathname('/ko')).toEqual(['common', 'landing', 'pricing']);
    });

    it('landing (/en)', () => {
      expect(getNamespacesForPathname('/en')).toEqual(['common', 'landing', 'pricing']);
    });

    it('pricing (/ko/pricing)', () => {
      expect(getNamespacesForPathname('/ko/pricing')).toEqual(['common', 'landing', 'pricing']);
    });
  });

  describe('public 라우트 — auth 추가', () => {
    it('login (/ko/login)', () => {
      expect(getNamespacesForPathname('/ko/login')).toEqual(['common', 'landing', 'pricing', 'auth']);
    });

    it('signup (/en/signup)', () => {
      expect(getNamespacesForPathname('/en/signup')).toEqual(['common', 'landing', 'pricing', 'auth']);
    });
  });

  describe('public 라우트 — faq 추가', () => {
    it('faq (/ko/faq)', () => {
      expect(getNamespacesForPathname('/ko/faq')).toEqual(['common', 'landing', 'pricing', 'faq']);
    });
  });

  describe('public 라우트 — about 추가', () => {
    it('about (/ko/about)', () => {
      expect(getNamespacesForPathname('/ko/about')).toEqual(['common', 'landing', 'pricing', 'about']);
    });
  });

  describe('public 라우트 — availability 추가', () => {
    it('availability detail (/ko/availability/airbnb/sample)', () => {
      expect(getNamespacesForPathname('/ko/availability/airbnb/sample')).toEqual([
        'common',
        'landing',
        'pricing',
        'availability',
      ]);
    });
  });

  describe('public 라우트 — legal 추가', () => {
    it('terms (/ko/terms)', () => {
      expect(getNamespacesForPathname('/ko/terms')).toEqual(['common', 'landing', 'pricing', 'legal']);
    });

    it('privacy (/en/privacy)', () => {
      expect(getNamespacesForPathname('/en/privacy')).toEqual(['common', 'landing', 'pricing', 'legal']);
    });
  });

  describe('app 라우트 — common만', () => {
    it('dashboard', () => {
      expect(getNamespacesForPathname('/dashboard')).toEqual(['common']);
    });

    it('accommodations', () => {
      expect(getNamespacesForPathname('/accommodations/123')).toEqual(['common']);
    });

    it('settings', () => {
      expect(getNamespacesForPathname('/settings/subscription')).toEqual(['common']);
    });

    it('admin', () => {
      expect(getNamespacesForPathname('/admin/users')).toEqual(['common']);
    });
  });

  describe('알 수 없는 public 하위 경로 — base 반환', () => {
    it('unknown segment', () => {
      expect(getNamespacesForPathname('/ko/unknown')).toEqual(['common', 'landing', 'pricing']);
    });
  });
});

describe('getAllNamespaces', () => {
  it('8개 전체 namespace를 반환한다', () => {
    const all = getAllNamespaces();
    expect(all).toHaveLength(8);
    expect(all).toContain('common');
    expect(all).toContain('landing');
    expect(all).toContain('legal');
    expect(all).toContain('auth');
    expect(all).toContain('pricing');
    expect(all).toContain('faq');
    expect(all).toContain('about');
    expect(all).toContain('availability');
  });
});
