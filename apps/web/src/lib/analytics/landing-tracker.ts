import crypto from 'crypto';

type LandingEvent =
  | 'landing_viewed'
  | 'hero_primary_cta_clicked'
  | 'hero_secondary_cta_clicked'
  | 'nav_pricing_clicked'
  | 'theme_toggled'
  | 'locale_toggled'
  | 'scroll_depth_70_reached'
  | 'closing_cta_clicked';

interface EventParams {
  session_id: string;
  user_type: 'guest' | 'member';
  locale: string;
  theme: string;
  breakpoint: string;
  timestamp_iso: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  [key: string]: string | undefined;
}

// Session management
let sessionId: string | null = null;
const sentEvents = new Set<string>();

/**
 * Get or create a persistent session identifier for the current page session.
 *
 * Generates a unique session ID on the first call and returns the cached ID on subsequent calls.
 *
 * @returns The session identifier string; the same value is returned for the lifetime of the page session.
 */
function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${crypto.randomUUID()}`;
  }
  return sessionId;
}

/**
 * Determines the viewport breakpoint category from the current window width.
 *
 * @returns `'mobile'`, `'tablet'`, `'pc'`, or `'wide'` corresponding to viewport widths: less than 768px, 768–1023px, 1024–1440px, and 1441px or greater, respectively.
 */
function getBreakpoint(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1441) return 'pc';
  return 'wide';
}

/**
 * Constructs the common analytics event parameters for the current session and page.
 *
 * @param locale - The user's locale identifier (for example, `en-US`)
 * @param theme - The current theme identifier (for example, `light` or `dark`)
 * @returns An EventParams object containing `session_id`, `user_type` (`guest`), `locale`, `theme`, `breakpoint`, `timestamp_iso`, `referrer`, and optional `utm_source`, `utm_medium`, and `utm_campaign` when present in the URL
 */
function getCommonParams(locale: string, theme: string): EventParams {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    session_id: getSessionId(),
    user_type: 'guest',
    locale,
    theme,
    breakpoint: getBreakpoint(),
    timestamp_iso: new Date().toISOString(),
    referrer: document.referrer || 'direct',
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
  };
}

/**
 * Record a landing page view event, ensuring it is sent at most once per session.
 *
 * Sends a `landing_viewed` event with common event parameters and prevents duplicate sends
 * for the same session.
 *
 * @param locale - The user's locale (e.g., "en-US") used in event parameters
 * @param theme - The current UI theme (e.g., "light" or "dark") used in event parameters
 */
export function trackLandingViewed(locale: string, theme: string): void {
  const eventKey = `${getSessionId()}_landing_viewed`;
  if (sentEvents.has(eventKey)) return;

  const params = getCommonParams(locale, theme);
  sendEvent('landing_viewed', params);
  sentEvents.add(eventKey);
}

/**
 * Record that the hero primary call-to-action was clicked.
 *
 * @param locale - The user's locale (e.g., "en-US")
 * @param theme - The current UI theme (e.g., "light" or "dark")
 */
export function trackPrimaryCTAClicked(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('hero_primary_cta_clicked', params);
}

/**
 * Record that the hero's secondary call-to-action was clicked.
 *
 * @param locale - The user's current locale (e.g., "en-US")
 * @param theme - The current UI theme identifier (e.g., "light" or "dark")
 */
export function trackSecondaryCTAClicked(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('hero_secondary_cta_clicked', params);
}

/**
 * Send a single `scroll_depth_70_reached` event the first time 70% scroll depth is reached in the current session.
 *
 * Does nothing if this event has already been sent for the current session.
 *
 * @param locale - Locale string to include in the event's common parameters
 * @param theme - Theme identifier to include in the event's common parameters
 */
export function trackScrollDepth70(locale: string, theme: string): void {
  const eventKey = `${getSessionId()}_scroll_depth_70_reached`;
  if (sentEvents.has(eventKey)) return;

  const params = getCommonParams(locale, theme);
  sendEvent('scroll_depth_70_reached', params);
  sentEvents.add(eventKey);
}

/**
 * Records that the user toggled the site's theme.
 */
export function trackThemeToggled(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('theme_toggled', params);
}

/**
 * Record that the user changed the UI locale.
 *
 * @param locale - The newly selected locale identifier (for example, "en-US")
 * @param theme - The current theme value at the time of the toggle (for example, "light" or "dark")
 */
export function trackLocaleToggled(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('locale_toggled', params);
}

/**
 * Records that the landing page closing call-to-action button was clicked.
 *
 * @param locale - User locale code included in the event parameters
 * @param theme - Current UI theme included in the event parameters
 */
export function trackClosingCTAClicked(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('closing_cta_clicked', params);
}

/**
 * Dispatches a landing analytics event with best-effort delivery and non-blocking failure handling.
 *
 * Attempts to send the given event and its parameters to the analytics backend; errors are caught and logged and will not propagate to callers. The implementation is designed to perform at most one background retry on transient failures.
 *
 * @param eventName - The name of the landing event to send
 * @param params - Common event parameters to include with the event
 */
function sendEvent(eventName: LandingEvent, params: EventParams): void {
  // Console log for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, params);
  }

  // TODO: 실제 분석 서비스로 전송 (Google Analytics, Mixpanel 등)
  // Example:
  // gtag('event', eventName, params);
  // or
  // mixpanel.track(eventName, params);

  // For now, just log to console
  try {
    // Simulate API call
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ event: eventName, params }),
    // }).catch(() => {
    //   // TR-008: Retry once on failure
    // });
  } catch (error) {
    // Silently fail - don't block UI
    console.error('[Analytics] Failed to send event:', eventName, error);
  }
}

/**
 * Attach a passive scroll listener that sends a `scroll_depth_70_reached` event once when the user reaches 70% of the page.
 *
 * @param locale - Current UI locale used when constructing the event payload
 * @param theme - Current UI theme used when constructing the event payload
 * @returns A cleanup function that removes the scroll listener added by this call
 */
export function setupScrollDepthTracking(locale: string, theme: string): () => void {
  let hasTracked = false;

  const handleScroll = (): void => {
    if (hasTracked) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercent = (scrollTop + windowHeight) / documentHeight;

    if (scrollPercent >= 0.7) {
      trackScrollDepth70(locale, theme);
      hasTracked = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  return (): void => {
    window.removeEventListener('scroll', handleScroll);
  };
}