/**
 * @shared - Universal shared code
 *
 * This module contains runtime-agnostic code that can be used by both web and worker.
 *
 * ALLOWED:
 * - Types, interfaces, DTOs
 * - Pure utilities with no side effects
 * - Constants, enums, mappings
 * - Formatting and parsing utilities
 *
 * FORBIDDEN:
 * - Network I/O (fetch, axios)
 * - Database access (Prisma)
 * - Node built-in modules (fs, path)
 * - Browser automation (puppeteer)
 * - Direct process.env access
 */

// Types
export * from './types/index.js';

// URL Parser / Builder (pure)
export { parseAccommodationUrl } from './urlParser.js';
export { buildAccommodationUrl } from './urlBuilder.js';

// Checker utilities (pure)
export { parsePrice } from './checkers/priceParser.js';
export type { ParsedPrice } from './checkers/priceParser.js';
export { isRetryableError, formatDate, delay, calculateNights } from './checkers/utils.js';
export { AGODA_PATTERNS, AIRBNB_PATTERNS, PRICE_PATTERN, RETRYABLE_ERRORS } from './checkers/constants.js';

// Notification utilities (pure)
export {
  buildKakaoNotificationSender,
  prependKakaoNotificationLabel,
  prependKakaoNotificationSender,
} from './utils/kakaoNotification.js';
export type { KakaoNotificationContext } from './utils/kakaoNotification.js';
