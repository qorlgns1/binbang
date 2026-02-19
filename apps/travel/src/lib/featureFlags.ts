function parseBooleanFlag(rawValue: string | undefined, defaultValue: boolean): boolean {
  if (rawValue == null) return defaultValue;
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === '') return defaultValue;
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
  return defaultValue;
}

export function isAffiliateCtaEnabled(): boolean {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_TRAVEL_AFFILIATE_CTA_ENABLED ?? process.env.TRAVEL_AFFILIATE_CTA_ENABLED,
    true,
  );
}

export function isAffiliateTrackingEnabled(): boolean {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_TRAVEL_AFFILIATE_TRACKING_ENABLED ?? process.env.TRAVEL_AFFILIATE_TRACKING_ENABLED,
    true,
  );
}

export function isRestoreAutoEnabled(): boolean {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_TRAVEL_RESTORE_AUTO_ENABLED ?? process.env.TRAVEL_RESTORE_AUTO_ENABLED,
    true,
  );
}

export function isHistoryEditEnabled(): boolean {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_TRAVEL_HISTORY_EDIT_ENABLED ?? process.env.TRAVEL_HISTORY_EDIT_ENABLED,
    true,
  );
}
