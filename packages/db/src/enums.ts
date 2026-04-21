// Platform
export const Platform = {
  AIRBNB: 'AIRBNB',
  AGODA: 'AGODA',
} as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

// AvailabilityStatus
export const AvailabilityStatus = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  ERROR: 'ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;
export type AvailabilityStatus = (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];

// QuotaKey
export const QuotaKey = {
  MAX_ACCOMMODATIONS: 'MAX_ACCOMMODATIONS',
  CHECK_INTERVAL_MIN: 'CHECK_INTERVAL_MIN',
} as const;
export type QuotaKey = (typeof QuotaKey)[keyof typeof QuotaKey];

// SubscriptionStatus
export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  TRIALING: 'TRIALING',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

// SelectorCategory
export const SelectorCategory = {
  PRICE: 'PRICE',
  AVAILABILITY: 'AVAILABILITY',
  METADATA: 'METADATA',
  PLATFORM_ID: 'PLATFORM_ID',
} as const;
export type SelectorCategory = (typeof SelectorCategory)[keyof typeof SelectorCategory];

// PatternType
export const PatternType = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;
export type PatternType = (typeof PatternType)[keyof typeof PatternType];

// FormQuestionField
export const FormQuestionField = {
  CONTACT_CHANNEL: 'CONTACT_CHANNEL',
  CONTACT_VALUE: 'CONTACT_VALUE',
  TARGET_URL: 'TARGET_URL',
  CONDITION_DEFINITION: 'CONDITION_DEFINITION',
  REQUEST_WINDOW: 'REQUEST_WINDOW',
  CHECK_FREQUENCY: 'CHECK_FREQUENCY',
  BILLING_CONSENT: 'BILLING_CONSENT',
  SCOPE_CONSENT: 'SCOPE_CONSENT',
} as const;
export type FormQuestionField = (typeof FormQuestionField)[keyof typeof FormQuestionField];

// FormSubmissionStatus
export const FormSubmissionStatus = {
  RECEIVED: 'RECEIVED',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  REJECTED: 'REJECTED',
  PROCESSED: 'PROCESSED',
} as const;
export type FormSubmissionStatus = (typeof FormSubmissionStatus)[keyof typeof FormSubmissionStatus];

// CaseStatus
export const CaseStatus = {
  RECEIVED: 'RECEIVED',
  REVIEWING: 'REVIEWING',
  NEEDS_CLARIFICATION: 'NEEDS_CLARIFICATION',
  WAITING_PAYMENT: 'WAITING_PAYMENT',
  ACTIVE_MONITORING: 'ACTIVE_MONITORING',
  CONDITION_MET: 'CONDITION_MET',
  BILLED: 'BILLED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

// NotificationStatus
export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];

// BillingEventType
export const BillingEventType = {
  CONDITION_MET_FEE: 'CONDITION_MET_FEE',
} as const;
export type BillingEventType = (typeof BillingEventType)[keyof typeof BillingEventType];

// PredictionConfidence
export const PredictionConfidence = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type PredictionConfidence = (typeof PredictionConfidence)[keyof typeof PredictionConfidence];

// AffiliateAdvertiserCategory
export const AffiliateAdvertiserCategory = {
  accommodation: 'accommodation',
  flight: 'flight',
  esim: 'esim',
  car_rental: 'car_rental',
  travel_package: 'travel_package',
  other: 'other',
} as const;
export type AffiliateAdvertiserCategory =
  (typeof AffiliateAdvertiserCategory)[keyof typeof AffiliateAdvertiserCategory];

// AffiliateEventType
export const AffiliateEventType = {
  impression: 'impression',
  cta_attempt: 'cta_attempt',
  outbound_click: 'outbound_click',
} as const;
export type AffiliateEventType = (typeof AffiliateEventType)[keyof typeof AffiliateEventType];

// ConversationAffiliateOverride
export const ConversationAffiliateOverride = {
  inherit: 'inherit',
  enabled: 'enabled',
  disabled: 'disabled',
} as const;
export type ConversationAffiliateOverride =
  (typeof ConversationAffiliateOverride)[keyof typeof ConversationAffiliateOverride];
