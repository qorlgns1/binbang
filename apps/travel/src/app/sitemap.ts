import type { MetadataRoute } from 'next';

import { getPublishedDestinations } from '@/services/destination.service';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://travel.moodybeard.com';
  const locales = ['ko', 'en'];
  const destinations = await getPublishedDestinations({ limit: 1000 });

  const staticRoutes = locales.flatMap((locale) => [
    { url: `${baseUrl}/${locale}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    {
      url: `${baseUrl}/${locale}/destinations`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ]);

  const destinationRoutes = destinations.flatMap((dest) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/destinations/${dest.slug}`,
      lastModified: dest.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  );

  return [...staticRoutes, ...destinationRoutes];
}
