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

type AgodaHotelRow = {
  hotelId: number;
  hotelName: string;
  hotelTranslatedName: string | null;
  cityName: string | null;
  countryName: string | null;
  starRating: number | null;
  photoUrl: string | null;
};

export async function searchAgodaHotels(query: string): Promise<AgodaHotelSearchResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < MIN_QUERY_LENGTH) return [];

  const likePattern = `%${trimmedQuery}%`;

  // GIN trigram 인덱스를 직접 활용하기 위해 $queryRaw 사용.
  // Prisma의 contains는 ILIKE '%...%'로 변환되지만 OR 절 전체에 걸쳐
  // cityName/countryName에 인덱스가 없어 seq scan이 발생함.
  // hotelName/hotelTranslatedName에만 검색을 한정하고 word_similarity로 정렬.
  const hotels = await prisma.$queryRaw<AgodaHotelRow[]>`
    SELECT
      "hotelId",
      "hotelName",
      "hotelTranslatedName",
      "cityName",
      "countryName",
      "starRating",
      "photoUrl"
    FROM agoda_hotels
    WHERE "hotelName" ILIKE ${likePattern}
       OR "hotelTranslatedName" ILIKE ${likePattern}
    ORDER BY
      word_similarity(${trimmedQuery}, COALESCE("hotelTranslatedName", "hotelName")) DESC,
      "starRating" DESC NULLS LAST
    LIMIT ${MAX_RESULTS}
  `;

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
