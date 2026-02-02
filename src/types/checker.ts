import type { Platform } from '@/generated/prisma/client';

export interface CheckResult {
  available: boolean;
  price: string | null;
  checkUrl: string;
  error: string | null;
}

export interface AccommodationToCheck {
  id: string;
  url: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  platform: Platform;
}
