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

export function createSessionId(): string {
  return crypto.randomUUID();
}

export function parseSessionId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const parsed = sessionIdSchema.safeParse(value.trim());
  return parsed.success ? parsed.data : null;
}
