export interface Accommodation {
  id: string;
  userId: string;
  name: string;
  platform: 'AIRBNB' | 'AGODA';
  url: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  isActive: boolean;
  lastCheck: string | null;
  lastStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'ERROR' | 'UNKNOWN';
  lastPrice: string | null;
  createdAt: string;
  updatedAt: string;
  checkLogs?: CheckLog[];
}

export interface CheckLog {
  id: string;
  accommodationId: string;
  userId: string;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'ERROR' | 'UNKNOWN';
  price: string | null;
  errorMessage: string | null;
  notificationSent: boolean;
  createdAt: string;
}

export interface RecentLog extends CheckLog {
  accommodation: { name: string };
}

export interface CheckLogsPage {
  logs: CheckLog[];
  nextCursor: string | null;
}

export interface CreateAccommodationInput {
  name: string;
  platform: string;
  url: string;
  checkIn: string;
  checkOut: string;
  adults: number;
}

export interface UpdateAccommodationInput {
  name?: string;
  url?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  isActive?: boolean;
}
