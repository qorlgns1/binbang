import { z } from 'zod';

export const TRAVEL_SESSION_STORAGE_KEY = 'travel_session_id';
export const TRAVEL_SESSION_COOKIE_NAME = 'travel_session_id';
export const TRAVEL_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const TRAVEL_SESSION_TTL_SECONDS = Math.floor(TRAVEL_SESSION_TTL_MS / 1000);

const sessionIdSchema = z.string().uuid();

export interface StoredTravelSession {
  sessionId: string;
  expiresAt: number;
}

function createFallbackUuid(): string {
  const bytes = new Uint8Array(16);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    throw new Error('Secure random (crypto.getRandomValues) is required for session ID');
  }

  // RFC 4122 v4 variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));

  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}

export function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return createFallbackUuid();
}

export function parseSessionId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = sessionIdSchema.safeParse(value.trim());
  return parsed.success ? parsed.data : null;
}
