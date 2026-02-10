import type { AccommodationToCheck, CheckResult } from '@workspace/shared';

import { checkAgoda } from './agoda';
import { checkAirbnb } from './airbnb';
import type { CheckerRuntimeConfig } from './baseChecker';
import type { PlatformSelectorCache } from './selectors';

export { checkAgoda } from './agoda';
export { checkAirbnb } from './airbnb';
export { initBrowserPool, closeBrowserPool, acquireBrowser, releaseBrowser } from './browserPool';
export type { PlatformSelectorCache, SelectorConfig } from './selectors';

export type { AccommodationToCheck, CheckResult };
export type { CheckerRuntimeConfig } from './baseChecker';
export type { BrowserLaunchConfig, PageSetupConfig } from './browser';
export type { BrowserPoolConfig } from './browserPool';

export interface CheckAccommodationOptions {
  runtimeConfig: CheckerRuntimeConfig;
  testableAttributes?: string[];
  /** 셀렉터/패턴 캐시 (runtime에서 getPlatformSelectors(platform)로 로드하여 전달) */
  selectorCache: PlatformSelectorCache;
}

export async function checkAccommodation(
  accommodation: AccommodationToCheck,
  options: CheckAccommodationOptions,
): Promise<CheckResult> {
  if (accommodation.platform === 'AIRBNB') {
    return checkAirbnb(accommodation, { ...options, selectorCache: options.selectorCache });
  }

  if (accommodation.platform === 'AGODA') {
    return checkAgoda(accommodation, { ...options, selectorCache: options.selectorCache });
  }

  return {
    available: false,
    price: null,
    checkUrl: accommodation.url,
    error: `Unknown platform: ${accommodation.platform}`,
    retryCount: 0,
  };
}
