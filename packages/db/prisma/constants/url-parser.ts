import { Platform } from '@/generated/prisma/enums';

interface ParsedAccommodationUrl {
  platform: Platform | null;
  baseUrl: string;
  checkIn: string | null;
  checkOut: string | null;
  adults: number | null;
  name: string | null;
}

/**
 * 숙소 URL을 파싱하여 정보 추출 (seed용 로컬 버전)
 */
export function parseAccommodationUrl(url: string): ParsedAccommodationUrl {
  const result: ParsedAccommodationUrl = {
    platform: null,
    baseUrl: url,
    checkIn: null,
    checkOut: null,
    adults: null,
    name: null,
  };

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    if (urlObj.hostname.includes('airbnb')) {
      return parseAirbnbUrl(urlObj, params);
    } else if (urlObj.hostname.includes('agoda')) {
      return parseAgodaUrl(urlObj, params);
    }
  } catch {
    // URL 파싱 실패 시 기본값 반환
  }

  return result;
}

function parseAirbnbUrl(urlObj: URL, params: URLSearchParams): ParsedAccommodationUrl {
  const pathMatch = urlObj.pathname.match(/\/rooms\/(\d+)/);
  const roomId = pathMatch ? pathMatch[1] : null;
  const baseUrl = roomId ? `${urlObj.origin}/rooms/${roomId}` : `${urlObj.origin}${urlObj.pathname}`;

  const checkIn = params.get('check_in');
  const checkOut = params.get('check_out');
  const adults = params.get('adults');

  return {
    platform: Platform.AIRBNB,
    baseUrl,
    checkIn: checkIn && isValidDate(checkIn) ? checkIn : null,
    checkOut: checkOut && isValidDate(checkOut) ? checkOut : null,
    adults: adults ? parseInt(adults, 10) : null,
    name: null,
  };
}

function parseAgodaUrl(urlObj: URL, params: URLSearchParams): ParsedAccommodationUrl {
  const baseUrl = `${urlObj.origin}${urlObj.pathname}`;

  const pathMatch = urlObj.pathname.match(/\/([^/]+)\/hotel\//);
  const name = pathMatch ? formatHotelName(pathMatch[1]) : null;

  const checkIn = params.get('checkIn');
  const los = params.get('los');

  let checkOut: string | null = null;
  if (checkIn && isValidDate(checkIn) && los) {
    const nights = parseInt(los, 10);
    if (!isNaN(nights) && nights > 0) {
      checkOut = calculateCheckOut(checkIn, nights);
    }
  }

  const adults = params.get('adults');

  return {
    platform: Platform.AGODA,
    baseUrl,
    checkIn: checkIn && isValidDate(checkIn) ? checkIn : null,
    checkOut,
    adults: adults ? parseInt(adults, 10) : null,
    name,
  };
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function calculateCheckOut(checkIn: string, nights: number): string {
  const date = new Date(checkIn);
  date.setDate(date.getDate() + nights);
  return date.toISOString().split('T')[0];
}

function formatHotelName(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
