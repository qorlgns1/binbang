import type { Platform } from '@workspace/db';

import { calculateNights, formatDate } from './checkers/utils';

interface BuildUrlParams {
  url: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  rooms?: number;
  platform: Platform;
}

export function buildAccommodationUrl(params: BuildUrlParams): string {
  const baseUrl = params.url.split('?')[0];

  switch (params.platform) {
    case 'AIRBNB':
      return `${baseUrl}?check_in=${formatDate(params.checkIn)}&check_out=${formatDate(params.checkOut)}&adults=${params.adults}`;
    case 'AGODA': {
      const nights = calculateNights(params.checkIn, params.checkOut);
      const rooms = params.rooms ?? 1;
      return `${baseUrl}?checkIn=${formatDate(params.checkIn)}&los=${nights}&adults=${params.adults}&rooms=${rooms}&cid=1890020`;
    }
  }
}
