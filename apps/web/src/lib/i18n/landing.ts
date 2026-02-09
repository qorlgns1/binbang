/**
 * Landing page i18n loader
 * Reads translations from public/locales at runtime (server-only)
 */
import { readFileSync } from 'fs';
import { join } from 'path';

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
  };
  mockLogs: Array<{
    id: number;
    message: string;
    location: string;
  }>;
}

export function getLandingCopy(lang: Lang): LandingCopy {
  const filePath = join(process.cwd(), 'public', 'locales', lang, 'landing.json');
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as LandingCopy;
}
