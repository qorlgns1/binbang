import { getDataSource, getQualifiedAgodaHotelsTable } from '@workspace/db';

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
  const ds = await getDataSource();
  const agodaHotelsTable = getQualifiedAgodaHotelsTable();

  const rows = await ds.query<Array<{ countryCode: string; countryName: string | null }>>(
    `SELECT "countryCode", MAX("countryName") AS "countryName" FROM ${agodaHotelsTable} WHERE "countryCode" IS NOT NULL GROUP BY "countryCode"`,
  );

  return rows
    .filter((r): r is typeof r & { countryCode: string } => r.countryCode != null)
    .map((r) => ({
      countryCode: r.countryCode,
      countryName: r.countryName ?? null,
    }))
    .sort((a, b) => (a.countryName ?? a.countryCode).localeCompare(b.countryName ?? b.countryCode, 'ko'));
}

export async function searchAgodaHotels(
  query: string,
  options: { countryCode?: string; limit?: number } = {},
): Promise<AgodaHotelRow[]> {
  const { countryCode, limit = 20 } = options;
  const likePattern = `%${query.toUpperCase()}%`;

  const ds = await getDataSource();
  const agodaHotelsTable = getQualifiedAgodaHotelsTable();

  const params: unknown[] = [likePattern];
  let countryFilter = '';
  if (countryCode) {
    params.push(countryCode);
    countryFilter = ` AND "countryCode" = :${params.length}`;
  }
  params.push(limit);

  const hotels = await ds.query<AgodaHotelRow[]>(
    `SELECT "hotelId", "cityId", "hotelName", "hotelTranslatedName", "cityName", "countryName", "countryCode", "starRating", "ratingAverage", "reviewCount"
     FROM ${agodaHotelsTable}
     WHERE (UPPER("hotelName") LIKE :1 OR UPPER("hotelTranslatedName") LIKE :1)${countryFilter}
     ORDER BY "reviewCount" DESC NULLS LAST
     FETCH FIRST :${params.length} ROWS ONLY`,
    params,
  );

  return hotels;
}
