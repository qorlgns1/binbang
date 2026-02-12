import type { AvailabilityStatus } from '@workspace/db';

export function determineStatus(result: { error: string | null; available: boolean }): AvailabilityStatus {
  if (result.error) return 'ERROR';
  if (result.available) return 'AVAILABLE';
  return 'UNAVAILABLE';
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const inDay = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const outDay = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
  const nights = Math.round((outDay - inDay) / (1000 * 60 * 60 * 24));
  return Math.max(nights, 1);
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function isSameStayDates(a: { checkIn: Date; checkOut: Date }, b: { checkIn: Date; checkOut: Date }): boolean {
  return toDateStr(a.checkIn) === toDateStr(b.checkIn) && toDateStr(a.checkOut) === toDateStr(b.checkOut);
}

export function shouldSendAvailabilityNotification(
  status: AvailabilityStatus,
  lastStatus: AvailabilityStatus | null,
  hasKakaoToken: boolean,
): boolean {
  return status === 'AVAILABLE' && lastStatus !== 'AVAILABLE' && Boolean(hasKakaoToken);
}
