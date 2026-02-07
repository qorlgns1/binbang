import type { Platform } from '@/generated/prisma/client';

export interface ParsedAccommodationUrl {
  platform: Platform | null;
  baseUrl: string;
  checkIn: string | null;
  checkOut: string | null;
  adults: number | null;
  name: string | null;
}
