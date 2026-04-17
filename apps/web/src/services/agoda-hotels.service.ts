import { getDataSource, getQualifiedAgodaHotelsTable } from '@workspace/db';

const MAX_RESULTS = 20;
const MIN_QUERY_LENGTH = 2;

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

  const ds = await getDataSource();
  const agodaHotelsTable = getQualifiedAgodaHotelsTable();
  const exactPattern = trimmedQuery.toUpperCase();

  try {
    // Oracle Text domain index를 우선 사용해 전체 스캔을 피한다.
    const hotels = await ds.query<AgodaHotelRow[]>(
      `SELECT "hotelId",
              "hotelName",
              "hotelTranslatedName",
              "cityName",
              "countryName",
              "starRating",
              "photoUrl"
         FROM ${agodaHotelsTable}
        WHERE CONTAINS("hotelTranslatedName", :1, 1) > 0
           OR CONTAINS("hotelName", :2, 2) > 0
        ORDER BY "starRating" DESC NULLS LAST,
                 "hotelId" ASC
        FETCH FIRST ${MAX_RESULTS} ROWS ONLY`,
      [trimmedQuery, trimmedQuery],
    );

    return hotels.map((hotel) => ({
      hotelId: hotel.hotelId.toString(),
      name: hotel.hotelTranslatedName || hotel.hotelName,
      nameEn: hotel.hotelName,
      city: hotel.cityName,
      country: hotel.countryName,
      starRating: hotel.starRating,
      photoUrl: hotel.photoUrl,
    }));
  } catch (error) {
    // Oracle Text 쿼리 파서가 특수문자 입력을 거부하면 LIKE fallback으로만 처리한다.
    console.warn('[agoda-hotels] Oracle Text search failed, falling back to LIKE search', error);

    const likePattern = `%${exactPattern}%`;
    const hotels = await ds.query<AgodaHotelRow[]>(
      `SELECT "hotelId", "hotelName", "hotelTranslatedName", "cityName", "countryName", "starRating", "photoUrl"
         FROM ${agodaHotelsTable}
        WHERE UPPER("hotelName") LIKE :1
           OR UPPER("hotelTranslatedName") LIKE :2
        ORDER BY "starRating" DESC NULLS LAST
        FETCH FIRST ${MAX_RESULTS} ROWS ONLY`,
      [likePattern, likePattern],
    );

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
}
