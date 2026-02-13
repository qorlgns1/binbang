import type { MetadataRoute } from 'next';

import { getBaseUrl, PUBLIC_PATHS } from '@/lib/i18n-runtime/seo';
import { SUPPORTED_LOCALES } from '@workspace/shared/i18n';

const PRIORITY_AND_FREQ: Record<string, { priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = {
  '': { priority: 1.0, changeFrequency: 'weekly' },
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
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const path of PUBLIC_PATHS) {
    const { priority, changeFrequency } = PRIORITY_AND_FREQ[path] ?? {
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    };
    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: `${baseUrl}/${lang}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      });
    }
  }

  return entries;
}
