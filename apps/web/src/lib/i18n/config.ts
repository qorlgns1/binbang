export type Lang = 'ko' | 'en';

export const supportedLangs: readonly Lang[] = ['ko', 'en'] as const;

export function isValidLang(lang: string): lang is Lang {
  return supportedLangs.includes(lang as Lang);
}
