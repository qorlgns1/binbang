import { prisma } from '@workspace/db';

export type AgodaHotelRow = {
  hotelId: number;
  cityId: number;
  hotelName: string;
  hotelTranslatedName: string | null;
  cityName: string | null;
  countryName: string | null;
  countryCode: string | null;
  starRating: number | null;
  ratingAverage: number | null;
  reviewCount: number | null;
};

export type AgodaCountryOption = { countryCode: string; countryName: string | null };

/** DB에 실제 존재하는 (countryCode, countryName) 목록. countryName 기준 정렬. */
export async function getAgodaHotelCountries(): Promise<AgodaCountryOption[]> {
  const rows = await prisma.agodaHotel.groupBy({
    by: ['countryCode'],
    where: { countryCode: { not: null } },
    _max: { countryName: true },
  });
  return rows
    .filter((r): r is typeof r & { countryCode: string } => r.countryCode != null)
    .map((r) => ({
      countryCode: r.countryCode,
      countryName: r._max.countryName ?? null,
    }))
    .sort((a, b) => (a.countryName ?? a.countryCode).localeCompare(b.countryName ?? b.countryCode, 'ko'));
}

export async function searchAgodaHotels(
  query: string,
  options: { countryCode?: string; limit?: number } = {},
): Promise<AgodaHotelRow[]> {
  const { countryCode, limit = 20 } = options;

  return prisma.agodaHotel.findMany({
    where: {
      OR: [
        { hotelName: { contains: query, mode: 'insensitive' } },
        { hotelTranslatedName: { contains: query, mode: 'insensitive' } },
      ],
      ...(countryCode ? { countryCode } : {}),
    },
    select: {
      hotelId: true,
      cityId: true,
      hotelName: true,
      hotelTranslatedName: true,
      cityName: true,
      countryName: true,
      countryCode: true,
      starRating: true,
      ratingAverage: true,
      reviewCount: true,
    },
    orderBy: [{ reviewCount: 'desc' }],
    take: limit,
  });
}
