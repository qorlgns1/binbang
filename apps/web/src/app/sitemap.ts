import type { MetadataRoute } from 'next';

import { getBaseUrl, PUBLIC_PATHS, buildAvailabilityPath } from '@/lib/i18n-runtime/seo';
import { getPublicAvailabilitySitemapItems, getRegionalSitemapItems } from '@/services/public-availability.service';
import { SUPPORTED_LOCALES } from '@workspace/shared/i18n';

export const revalidate = 3600;
const SITEMAP_URL_LIMIT = 50_000;

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

/**
 * Next.js sitemap convention: served at /sitemap.xml with correct XML and Content-Type.
 * alternates.languages (hreflang) is omitted here so XML renders correctly; hreflang is
 * already set per-page via generateMetadata alternates.languages on Public pages.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const entries: MetadataRoute.Sitemap = [];
  let availabilityItems: Awaited<ReturnType<typeof getPublicAvailabilitySitemapItems>> = [];
  let regionalItems: Awaited<ReturnType<typeof getRegionalSitemapItems>> = [];

  const staticEntryCount = PUBLIC_PATHS.length * SUPPORTED_LOCALES.length;
  const reservedForRegions = 50 * SUPPORTED_LOCALES.length; // Top 50 regions
  const maxPropertyItems = Math.max(
    0,
    Math.floor((SITEMAP_URL_LIMIT - staticEntryCount - reservedForRegions) / SUPPORTED_LOCALES.length),
  );

  // Fetch regional items (top 50 regions by property count)
  try {
    regionalItems = await getRegionalSitemapItems({ limit: 50 });
  } catch (error) {
    console.error('[sitemap] failed to load regional items', error);
    regionalItems = [];
  }

  // Fetch property items
  if (maxPropertyItems > 0) {
    try {
      availabilityItems = await getPublicAvailabilitySitemapItems({ limit: maxPropertyItems });
      if (availabilityItems.length === maxPropertyItems) {
        console.warn(
          `[sitemap] availability items reached limit (${maxPropertyItems}). Consider sitemap split or stronger filters.`,
        );
      }
    } catch (error) {
      console.error('[sitemap] failed to load availability items, falling back to static URLs only', error);
      availabilityItems = [];
    }
  }

  // Static pages
  for (const path of PUBLIC_PATHS) {
    const { priority, changeFrequency } = PRIORITY_AND_FREQ[path] ?? {
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    };
    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}/${lang}${path}`,
        changeFrequency,
        priority,
      });
    }
  }

  // Regional pages (high priority - 0.8)
  for (const region of regionalItems) {
    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}/${lang}/availability/${region.platformSegment}/region/${region.regionKey}`,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  // Individual property pages (0.7)
  for (const item of availabilityItems) {
    const path = buildAvailabilityPath(item.platformSegment, item.slug);
    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}/${lang}${path}`,
        lastModified: new Date(item.lastModified),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  }

  return entries;
}
