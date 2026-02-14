import type { LandingClickEventName } from '@/lib/analytics/click-event-names';
import { sendGa4Event } from '@/lib/analytics/gtag';

const DEDUPE_WINDOW_MS = 800;
const MAX_RECENT_EVENTS = 100;
const RECENT_EVENT_TTL_MS = DEDUPE_WINDOW_MS * 10;
const recentEvents = new Map<string, number>();
let sessionId: string | null = null;
let fallbackSequence = 0;

interface TrackClickEventInput {
  eventName: LandingClickEventName;
  source: string;
  locale?: string;
  path?: string;
}

function getSessionId(): string {
  if (sessionId) return sessionId;

  sessionId = `click_${createSessionEntropy()}`;
  return sessionId;
}

function createSessionEntropy(): string {
  if (typeof globalThis.crypto !== 'undefined') {
    if (typeof globalThis.crypto.randomUUID === 'function') {
      return globalThis.crypto.randomUUID().replaceAll('-', '');
    }

    if (typeof globalThis.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes, (value): string => value.toString(16).padStart(2, '0')).join('');
    }
  }

  fallbackSequence += 1;
  return `${Date.now().toString(36)}_${fallbackSequence.toString(36)}`;
}

function shouldDropDuplicate(eventName: LandingClickEventName, path: string): boolean {
  const key = `${eventName}:${path}`;
  const now = Date.now();
  const previous = recentEvents.get(key);

  if (typeof previous === 'number' && now - previous < DEDUPE_WINDOW_MS) {
    return true;
  }

  if (recentEvents.size >= MAX_RECENT_EVENTS) {
    const threshold = now - RECENT_EVENT_TTL_MS;
    for (const [eventKey, timestamp] of recentEvents.entries()) {
      if (timestamp < threshold) {
        recentEvents.delete(eventKey);
      }
    }
  }

  recentEvents.set(key, now);
  return false;
}

function sendBeaconPayload(payload: string): void {
  if (typeof navigator === 'undefined') return;

  if (typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/analytics/click', blob);
    return;
  }

  void fetch('/api/analytics/click', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics tracking should never block user actions.
  });
}

export function trackClickEvent(input: TrackClickEventInput): void {
  if (typeof window === 'undefined') return;

  const path = input.path ?? window.location.pathname;
  if (shouldDropDuplicate(input.eventName, path)) return;

  const payload = JSON.stringify({
    eventName: input.eventName,
    source: input.source,
    locale: input.locale,
    path,
    sessionId: getSessionId(),
    occurredAt: new Date().toISOString(),
  });

  sendBeaconPayload(payload);

  sendGa4Event(input.eventName, {
    source: input.source,
    locale: input.locale,
    path,
    session_id: getSessionId(),
  });
}
