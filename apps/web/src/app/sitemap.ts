import type { MetadataRoute } from 'next';

import { SUPPORTED_LOCALES } from '@workspace/shared/i18n';

import { buildPublicPath } from '@/lib/i18n-runtime/publicPath';
import { buildAvailabilityPath, getBaseUrl, PUBLIC_PATHS } from '@/lib/i18n-runtime/seo';
import {
  getPublicAvailabilitySitemapItems,
  getPublicAvailabilitySitemapTotalCount,
  getRegionalSitemapItems,
} from '@/services/public-availability.service';

export const revalidate = 3600;

const PROPERTY_SITEMAP_BATCH_SIZE = 10_000;
const STATIC_SITEMAP_ID = 0;
const REGIONS_SITEMAP_ID = 1;
const PROPERTIES_SITEMAP_START_ID = 2;

const PRIORITY_AND_FREQ: Record<string, { priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = {
  '': { priority: 1.0, changeFrequency: 'weekly' },
  '/availability': { priority: 0.8, changeFrequency: 'weekly' },
  '/pricing': { priority: 0.8, changeFrequency: 'monthly' },
  '/faq': { priority: 0.7, changeFrequency: 'monthly' },
  '/about': { priority: 0.7, changeFrequency: 'monthly' },
  '/login': { priority: 0.5, changeFrequency: 'yearly' },
  '/signup': { priority: 0.5, changeFrequency: 'yearly' },
  '/terms': { priority: 0.5, changeFrequency: 'monthly' },
  '/privacy': { priority: 0.5, changeFrequency: 'monthly' },
};

function buildStaticSitemapEntries(baseUrl: string): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PUBLIC_PATHS) {
    const { priority, changeFrequency } = PRIORITY_AND_FREQ[path] ?? {
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    };

    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}${buildPublicPath(lang, path)}`,
        changeFrequency,
        priority,
      });
    }
  }

  return entries;
}

async function buildRegionalSitemapEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  try {
    const regionalItems = await getRegionalSitemapItems({ limit: 2000 });

    for (const region of regionalItems) {
      for (const lang of SUPPORTED_LOCALES) {
        entries.push({
          url: `${baseUrl}${buildPublicPath(lang, `/availability/${region.platformSegment}/region/${region.regionKey}`)}`,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    console.error('[sitemap] failed to build regional sitemap entries', error);
  }

  return entries;
}

async function buildPropertySitemapEntries(baseUrl: string, sitemapId: number): Promise<MetadataRoute.Sitemap> {
  const propertyPageIndex = sitemapId - PROPERTIES_SITEMAP_START_ID;
  if (propertyPageIndex < 0) return [];

  try {
    const availabilityItems = await getPublicAvailabilitySitemapItems({
      limit: PROPERTY_SITEMAP_BATCH_SIZE,
      offset: propertyPageIndex * PROPERTY_SITEMAP_BATCH_SIZE,
    });

    const entries: MetadataRoute.Sitemap = [];

    for (const item of availabilityItems) {
      const path = buildAvailabilityPath(item.platformSegment, item.slug);
      for (const lang of SUPPORTED_LOCALES) {
        entries.push({
          url: `${baseUrl}${buildPublicPath(lang, path)}`,
          lastModified: new Date(item.lastModified),
          changeFrequency: 'daily',
          priority: 0.7,
        });
      }
    }

    return entries;
  } catch (error) {
    console.error('[sitemap] failed to build property sitemap entries', error);
    return [];
  }
}

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  let propertyTotalCount = 0;

  try {
    propertyTotalCount = await getPublicAvailabilitySitemapTotalCount();
  } catch (error) {
    console.error('[sitemap] failed to fetch property sitemap count', error);
    propertyTotalCount = 0;
  }

  const propertySitemapCount = Math.ceil(propertyTotalCount / PROPERTY_SITEMAP_BATCH_SIZE);

  return [
    { id: STATIC_SITEMAP_ID },
    { id: REGIONS_SITEMAP_ID },
    ...Array.from({ length: propertySitemapCount }, (_, index) => ({
      id: PROPERTIES_SITEMAP_START_ID + index,
    })),
  ];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  if (id === STATIC_SITEMAP_ID) {
    return buildStaticSitemapEntries(baseUrl);
  }

  if (id === REGIONS_SITEMAP_ID) {
    return buildRegionalSitemapEntries(baseUrl);
  }

  return buildPropertySitemapEntries(baseUrl, id);
}
