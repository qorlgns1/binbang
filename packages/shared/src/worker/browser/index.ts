import type { AccommodationToCheck, CheckResult } from '@/types/checker';

import { checkAgoda } from './agoda';
import { checkAirbnb } from './airbnb';
import type { CheckerRuntimeConfig } from './baseChecker';

export type { AccommodationToCheck, CheckResult };
export type { CheckerRuntimeConfig } from './baseChecker';
export type { BrowserLaunchConfig, PageSetupConfig } from './browser';
export type { BrowserPoolConfig } from './browserPool';

export interface CheckAccommodationOptions {
  runtimeConfig: CheckerRuntimeConfig;
  testableAttributes?: string[];
}

export async function checkAccommodation(
  accommodation: AccommodationToCheck,
  options: CheckAccommodationOptions,
): Promise<CheckResult> {
  if (accommodation.platform === 'AIRBNB') {
    return checkAirbnb(accommodation, options);
  }

  if (accommodation.platform === 'AGODA') {
    return checkAgoda(accommodation, options);
  }

  return {
    available: false,
    price: null,
    checkUrl: accommodation.url,
    error: `Unknown platform: ${accommodation.platform}`,
    retryCount: 0,
  };
}
