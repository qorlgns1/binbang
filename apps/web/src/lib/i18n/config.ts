export type Lang = 'ko' | 'en';

export const supportedLangs: readonly Lang[] = ['ko', 'en'] as const;

/**
 * Checks whether a string is a supported language code.
 *
 * @param lang - The language code to validate (e.g., "ko", "en")
 * @returns `true` if `lang` is one of the supported `Lang` values, `false` otherwise
 */
export function isValidLang(lang: string): lang is Lang {
  return supportedLangs.includes(lang as Lang);
}
