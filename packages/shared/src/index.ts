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
export * from './types';

// URL Parser / Builder (pure)
export { parseAccommodationUrl } from './urlParser';
export { buildAccommodationUrl } from './urlBuilder';

// Checker utilities (pure)
export { parsePrice } from './checkers/priceParser';
export type { ParsedPrice } from './checkers/priceParser';
export { isRetryableError, formatDate, delay, calculateNights } from './checkers/utils';
export { AGODA_PATTERNS, AIRBNB_PATTERNS, PRICE_PATTERN, RETRYABLE_ERRORS } from './checkers/constants';
