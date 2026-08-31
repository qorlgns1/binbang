export const LANDING_CLICK_EVENT_NAMES = [
  'nav_login',
  'nav_request',
  'nav_pricing',
  'mobile_menu_open',
  'mobile_menu_cta',
] as const;

export const LANDING_GROWTH_EVENT_NAMES = [
  'organic_landing',
  'availability_page_view',
  'availability_cta_hover',
  'availability_cta',
  'first_accommodation_start',
  'first_alert_created',
] as const;

export const LANDING_EVENT_NAMES = [...LANDING_CLICK_EVENT_NAMES, ...LANDING_GROWTH_EVENT_NAMES] as const;

export type LandingClickEventName = (typeof LANDING_CLICK_EVENT_NAMES)[number];
export type LandingGrowthEventName = (typeof LANDING_GROWTH_EVENT_NAMES)[number];
export type LandingEventName = (typeof LANDING_EVENT_NAMES)[number];
