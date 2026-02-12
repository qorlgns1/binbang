/**
 * Landing page i18n loader
 * Reads translations from messages/ at runtime (server-only)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Lang } from './config';

export type { Lang } from './config';
export { isValidLang, supportedLangs } from './config';

export interface LandingCopy {
  nav: {
    brand: string;
    features: string;
    status: string;
    pricing: string;
    login: string;
  };
  hero: {
    headline: string;
    headlineMobile: string[];
    subheadline: string;
    subheadlineMobile: string[];
    description: string;
    /** Hero 내 앱 목적 한 줄 (Google OAuth 검증: 첫 화면에 노출). */
    aboutApp: string;
    cta: string;
    secondaryCta: string;
    statusLabel: string;
  };
  features: {
    f1Title: string;
    f1Subtitle: string;
    f1Desc: string;
    f2Title: string;
    f2Subtitle: string;
    f2Desc: string;
    f3Title: string;
    f3Subtitle: string;
    f3Desc: string;
    learnMore: string;
  };
  trust: {
    title: string;
    operational: string;
    uptime: string;
    activeMonitors: string;
    response: string;
    emptyLogs: string;
    errorMessage: string;
    retry: string;
  };
  footer: {
    title: string;
    description: string;
    cta: string;
    copyright: string;
    privacy: string;
    terms: string;
  };
  /** 앱 목적 및 데이터 사용 목적 (Google OAuth 검증용). */
  appPurpose: string;
  mockLogs: Array<{
    id: number;
    message: string;
    location: string;
  }>;
}

/**
 * Load landing page translations for the specified language from messages/<lang>/landing.json.
 *
 * @param lang - Language code that identifies the locale directory to read
 * @returns The parsed `LandingCopy` object containing landing page strings for the given language
 */
export function getLandingCopy(lang: Lang): LandingCopy {
  const filePath = join(process.cwd(), 'messages', lang, 'landing.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as LandingCopy;
}
