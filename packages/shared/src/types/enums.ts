export const Platform = {
  AIRBNB: 'AIRBNB',
  AGODA: 'AGODA',
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

export const AvailabilityStatus = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  ERROR: 'ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;

export type AvailabilityStatus = (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];
