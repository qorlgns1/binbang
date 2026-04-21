export const PLANNER_EVENT_NAMES = [
  'landing_viewed',
  'planner_started',
  'planner_submitted',
  'planner_result_viewed',
  'planner_failed',
  'planner_empty_result',
  'accommodation_clicked',
  'alert_bridge_started',
] as const;

export type PlannerEventName = (typeof PLANNER_EVENT_NAMES)[number];

interface TrackPlannerEventInput {
  eventName: PlannerEventName;
  locale?: string;
  path?: string;
  hotelId?: string;
}

const onceEventMemoryCache = new Set<string>();
const plannerAccommodationIds = new Set<string>();
let sessionId: string | null = null;
let fallbackSequence = 0;

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

function getTrackingSessionId(): string {
  if (sessionId) {
    return sessionId;
  }

  sessionId = `planner_${createSessionEntropy()}`;
  return sessionId;
}

function resolveTrackingPath(input: TrackPlannerEventInput): string {
  const defaultPath = typeof window !== 'undefined' ? window.location.pathname : '/chat';
  const basePath = input.path ?? defaultPath;

  if (!input.hotelId) {
    return basePath;
  }

  const [pathname, rawSearch = ''] = basePath.split('?');
  const params = new URLSearchParams(rawSearch);
  params.set('hotelId', input.hotelId);
  const search = params.toString();

  return search ? `${pathname}?${search}` : pathname;
}

function sendBeaconPayload(payload: string): void {
  if (typeof navigator === 'undefined') {
    return;
  }

  if (typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon('/api/planner/event', blob);
    return;
  }

  void fetch('/api/planner/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Funnel tracking must never block the product flow.
  });
}

export function trackPlannerEvent(input: TrackPlannerEventInput): void {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = JSON.stringify({
    eventName: input.eventName,
    source: 'travel-planner',
    locale: input.locale,
    path: resolveTrackingPath(input),
    sessionId: getTrackingSessionId(),
    occurredAt: new Date().toISOString(),
  });

  sendBeaconPayload(payload);
}

export function trackPlannerEventOnce(onceKey: string, input: TrackPlannerEventInput): void {
  if (onceEventMemoryCache.has(onceKey)) {
    return;
  }

  onceEventMemoryCache.add(onceKey);
  trackPlannerEvent(input);
}

export function setPlannerTrackedAccommodationIds(placeIds: string[]): void {
  plannerAccommodationIds.clear();

  for (const placeId of placeIds) {
    const normalized = placeId.trim();
    if (normalized) {
      plannerAccommodationIds.add(normalized);
    }
  }
}

export function clearPlannerTrackedAccommodationIds(): void {
  plannerAccommodationIds.clear();
}

export function isPlannerTrackedAccommodation(placeId: string | undefined): boolean {
  if (!placeId) {
    return false;
  }

  return plannerAccommodationIds.has(placeId);
}
