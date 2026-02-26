import { prisma } from '@workspace/db';

const MAX_RESULTS = 20;
const MIN_QUERY_LENGTH = 1;

export interface AgodaHotelSearchResult {
  hotelId: string;
  name: string;
  nameEn: string;
  city: string | null;
  country: string | null;
  starRating: number | null;
  photoUrl: string | null;
}

export async function searchAgodaHotels(query: string): Promise<AgodaHotelSearchResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < MIN_QUERY_LENGTH) return [];

  const hotels = await prisma.agodaHotel.findMany({
    where: {
      OR: [
        { hotelName: { contains: trimmedQuery, mode: 'insensitive' } },
        { hotelTranslatedName: { contains: trimmedQuery, mode: 'insensitive' } },
        { cityName: { contains: trimmedQuery, mode: 'insensitive' } },
        { countryName: { contains: trimmedQuery, mode: 'insensitive' } },
      ],
    },
    select: {
      hotelId: true,
      hotelName: true,
      hotelTranslatedName: true,
      cityName: true,
      countryName: true,
      starRating: true,
      photoUrl: true,
    },
    take: MAX_RESULTS,
    orderBy: [{ starRating: 'desc' }, { hotelName: 'asc' }],
  });

  return hotels.map((hotel) => ({
    hotelId: hotel.hotelId.toString(),
    name: hotel.hotelTranslatedName || hotel.hotelName,
    nameEn: hotel.hotelName,
    city: hotel.cityName,
    country: hotel.countryName,
    starRating: hotel.starRating,
    photoUrl: hotel.photoUrl,
  }));
}
