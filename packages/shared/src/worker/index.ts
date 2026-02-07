/**
 * @shared/worker - Worker-only shared code
 *
 * This module contains code that should only be used by apps/worker.
 * apps/web MUST NOT import from this module.
 *
 * Includes:
 * - Browser automation (puppeteer)
 * - Settings (DB + process.env access)
 * - Heartbeat monitoring (DB access)
 * - Platform selectors (DB access)
 * - Kakao messaging (network I/O)
 */

// Browser automation
export { checkAccommodation } from './browser';
export { checkAirbnb } from './browser/airbnb';
export { checkAgoda } from './browser/agoda';
export {
  initBrowserPool,
  closeBrowserPool,
  acquireBrowser,
  releaseBrowser,
} from './browser/browserPool';

// Settings
export { getSettings, loadSettings } from './settings';
export { validateWorkerEnv, validateWebEnv, getEnv, getEnvNumber } from './settings/env';
export type { SystemSettingsCache } from './settings';

// Heartbeat
export {
  updateHeartbeat,
  startHeartbeatMonitoring,
  stopHeartbeatMonitoring,
  recordHeartbeatHistory,
  getHeartbeatHistory,
} from './heartbeat';
export type { HeartbeatHistoryItem } from './heartbeat';

// Selectors
export {
  loadPlatformSelectors,
  getPlatformSelectors,
  invalidateSelectorCache,
  preloadSelectorCache,
} from './selectors';
export type { PlatformSelectorCache, SelectorConfig } from './selectors';

// Kakao
export { notifyAvailable, sendKakaoMessage } from './kakao/message';
