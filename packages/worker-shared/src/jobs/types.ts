import type { AvailabilityStatus, Platform } from '@workspace/shared';

export interface CycleJobPayload {
  triggeredAt: string;
}

export interface CheckJobPayload {
  cycleId: string;
  accommodationId: string;
  name: string;
  url: string;
  platform: Platform;
  checkIn: string;
  checkOut: string;
  adults: number;
  userId: string;
  kakaoAccessToken: string | null;
  lastStatus: AvailabilityStatus | null;
  caseId?: string;
  conditionDefinition?: string;
}
