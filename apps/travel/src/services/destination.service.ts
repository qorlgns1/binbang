import { prisma } from '@workspace/db';
import type { Destination } from '@workspace/db';

/**
 * 슬러그로 공개된 여행지 조회
 */
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  return prisma.destination.findFirst({
    where: {
      slug,
      published: true,
    },
  });
}

/**
 * 모든 공개된 여행지 목록 조회 (목록 페이지용)
 */
export async function getPublishedDestinations(params?: {
  country?: string;
  limit?: number;
  offset?: number;
}): Promise<Destination[]> {
  return prisma.destination.findMany({
    where: {
      published: true,
      ...(params?.country && { country: params.country }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: params?.limit ?? 30,
    skip: params?.offset ?? 0,
  });
}

/**
 * 정적 생성을 위한 모든 여행지 슬러그 조회
 */
export async function getAllDestinationSlugs(): Promise<string[]> {
  const destinations = await prisma.destination.findMany({
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
  const result = await prisma.destination.groupBy({
    by: ['country'],
    where: {
      published: true,
    },
    _count: {
      id: true,
    },
  });

  return result.reduce(
    (acc, item) => {
      acc[item.country] = item._count.id;
      return acc;
    },
    {} as Record<string, number>,
  );
}
