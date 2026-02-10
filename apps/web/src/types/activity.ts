import type { AvailabilityStatus, Platform } from '@workspace/db/enums';

export type ActivityType = 'audit' | 'check' | 'accommodation';

export interface ActivityUser {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

export interface ActivityAccommodation {
  id: string;
  name: string;
  platform: Platform;
}

export interface UserActivityItem {
  id: string;
  type: ActivityType;
  action: string; // 'role.assign', 'plan.change', 'check', 'accommodation.create'
  createdAt: string;

  // audit 전용
  actor?: ActivityUser | null;
  oldValue?: unknown;
  newValue?: unknown;

  // check 전용
  status?: AvailabilityStatus;
  price?: string | null;
  accommodation?: ActivityAccommodation;

  // accommodation 전용
  accommodationName?: string;
  platform?: Platform;
}

export interface UserActivityResponse {
  activities: UserActivityItem[];
  nextCursor: string | null;
  total?: number;
}

export interface UserActivityFilters {
  type?: ActivityType | 'all';
  cursor?: string;
  limit?: number;
}
