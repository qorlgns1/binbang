import type { LandingClickEventName } from '@/lib/analytics/click-event-names';

const DEDUPE_WINDOW_MS = 800;
const recentEvents = new Map<string, number>();
let sessionId: string | null = null;

interface TrackClickEventInput {
  eventName: LandingClickEventName;
  source: string;
  locale?: string;
  path?: string;
}

function getSessionId(): string {
  if (sessionId) return sessionId;

  sessionId = `click_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return sessionId;
}

function shouldDropDuplicate(eventName: LandingClickEventName, path: string): boolean {
  const key = `${eventName}:${path}`;
  const now = Date.now();
  const previous = recentEvents.get(key);

  if (typeof previous === 'number' && now - previous < DEDUPE_WINDOW_MS) {
    return true;
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
}
