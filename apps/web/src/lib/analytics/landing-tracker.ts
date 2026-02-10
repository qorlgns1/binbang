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

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${crypto.randomUUID()}`;
  }
  return sessionId;
}

function getBreakpoint(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1441) return 'pc';
  return 'wide';
}

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
 * TR-005: landing_viewed는 세션당 1회만 전송
 */
export function trackLandingViewed(locale: string, theme: string): void {
  const eventKey = `${getSessionId()}_landing_viewed`;
  if (sentEvents.has(eventKey)) return;

  const params = getCommonParams(locale, theme);
  sendEvent('landing_viewed', params);
  sentEvents.add(eventKey);
}

/**
 * TR-004: hero_primary_cta_clicked는 클릭 즉시 전송
 */
export function trackPrimaryCTAClicked(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('hero_primary_cta_clicked', params);
}

/**
 * TR-005: hero_secondary_cta_clicked
 */
export function trackSecondaryCTAClicked(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('hero_secondary_cta_clicked', params);
}

/**
 * TR-006: scroll_depth_70_reached는 최초 도달 시 1회 전송
 */
export function trackScrollDepth70(locale: string, theme: string): void {
  const eventKey = `${getSessionId()}_scroll_depth_70_reached`;
  if (sentEvents.has(eventKey)) return;

  const params = getCommonParams(locale, theme);
  sendEvent('scroll_depth_70_reached', params);
  sentEvents.add(eventKey);
}

/**
 * Theme toggled
 */
export function trackThemeToggled(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('theme_toggled', params);
}

/**
 * Locale toggled
 */
export function trackLocaleToggled(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('locale_toggled', params);
}

/**
 * Closing CTA clicked
 */
export function trackClosingCTAClicked(locale: string, theme: string): void {
  const params = getCommonParams(locale, theme);
  sendEvent('closing_cta_clicked', params);
}

/**
 * TR-008: 이벤트 전송 실패 시 UI 동작은 유지하고 백그라운드 재시도는 최대 1회
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
 * Setup scroll depth tracking
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
