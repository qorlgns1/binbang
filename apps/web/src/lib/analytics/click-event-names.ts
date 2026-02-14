export const LANDING_CLICK_EVENT_NAMES = [
  'nav_signup',
  'nav_request',
  'nav_pricing',
  'mobile_menu_open',
  'mobile_menu_cta',
] as const;

export type LandingClickEventName = (typeof LANDING_CLICK_EVENT_NAMES)[number];
