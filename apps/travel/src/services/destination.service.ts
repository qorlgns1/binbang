import { getDataSource, Destination } from '@workspace/db';

type DestinationField =
  | 'id'
  | 'slug'
  | 'nameKo'
  | 'nameEn'
  | 'country'
  | 'countryCode'
  | 'description'
  | 'highlights'
  | 'weather'
  | 'currency'
  | 'latitude'
  | 'longitude'
  | 'imageUrl'
  | 'published'
  | 'createdAt'
  | 'updatedAt';

export type DestinationRecord = Pick<Destination, DestinationField>;

function toPlainDestination(destination: Destination): DestinationRecord {
  return {
    id: destination.id,
    slug: destination.slug,
    nameKo: destination.nameKo,
    nameEn: destination.nameEn,
    country: destination.country,
    countryCode: destination.countryCode,
    description: destination.description,
    highlights: destination.highlights,
    weather: destination.weather,
    currency: destination.currency,
    latitude: destination.latitude,
    longitude: destination.longitude,
    imageUrl: destination.imageUrl,
    published: destination.published,
    createdAt: destination.createdAt,
    updatedAt: destination.updatedAt,
  };
}

/**
 * 슬러그로 공개된 여행지 조회
 */
export async function getDestinationBySlug(slug: string): Promise<DestinationRecord | null> {
  const ds = await getDataSource();
  const destination = await ds.getRepository(Destination).findOne({
    where: {
      slug,
      published: true,
    },
  });

  return destination ? toPlainDestination(destination) : null;
}

/**
 * 모든 공개된 여행지 목록 조회 (목록 페이지용)
 */
export async function getPublishedDestinations(params?: {
  country?: string;
  limit?: number;
  offset?: number;
}): Promise<DestinationRecord[]> {
  const ds = await getDataSource();
  const destinations = await ds.getRepository(Destination).find({
    where: {
      published: true,
      ...(params?.country && { country: params.country }),
    },
    order: {
      createdAt: 'DESC',
    },
    ...(params?.limit !== undefined && { take: params.limit }),
    skip: params?.offset ?? 0,
  });

  return destinations.map(toPlainDestination);
}

/**
 * 정적 생성을 위한 모든 여행지 슬러그 조회
 */
export async function getAllDestinationSlugs(): Promise<string[]> {
  const ds = await getDataSource();
  const destinations = await ds.getRepository(Destination).find({
    where: {
      published: true,
    },
    select: {
      slug: true,
    },
  });

  return destinations.map((d) => d.slug);
}

/**
 * 국가별 여행지 개수 조회
 */
export async function getDestinationCountByCountry(): Promise<Record<string, number>> {
  const ds = await getDataSource();
  const rows = await ds
    .getRepository(Destination)
    .createQueryBuilder('dest')
    .select('dest.country', 'country')
    .addSelect('COUNT(dest.id)', 'cnt')
    .where('dest.published = :published', { published: true })
    .groupBy('dest.country')
    .getRawMany<{ country: string; cnt: string }>();

  return rows.reduce(
    (acc, item) => {
      acc[item.country] = Number(item.cnt);
      return acc;
    },
    {} as Record<string, number>,
  );
}
